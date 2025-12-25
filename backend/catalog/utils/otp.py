"""
Utility functions for 4-digit email OTP (one-time password) codes.
"""

import random
from datetime import timedelta

from django.utils import timezone

from ..models import EmailOTP


def generate_4_digit_code() -> str:
  """
  Generate a random 4-digit numeric code as a zero-padded string.
  """
  return f"{random.randint(0, 9999):04d}"


def create_or_refresh_otp(email: str, purpose: str, ttl_minutes: int = 10) -> EmailOTP:
  """
  Create a new OTP for the given email and purpose, invalidating any existing active codes.
  
  - Normalizes email to lowercase and trims whitespace.
  - Expires previous unused codes for this (email, purpose) pair.
  - Returns the newly created OTP instance.
  """
  normalized_email = (email or "").strip().lower()
  if not normalized_email:
    raise ValueError("Email is required to create an OTP.")

  # Invalidate any existing active codes for this email and purpose
  EmailOTP.objects.filter(
    email=normalized_email,
    purpose=purpose,
    used=False,
  ).update(
    used=True,
    expires_at=timezone.now(),
  )

  now = timezone.now()
  expires_at = now + timedelta(minutes=ttl_minutes)

  otp = EmailOTP.objects.create(
    email=normalized_email,
    code=generate_4_digit_code(),
    purpose=purpose,
    expires_at=expires_at,
    attempt_count=0,
    # max_attempts uses model default
  )
  return otp


class OTPValidationResult:
  """
  Simple result object for OTP validation.
  
  Attributes:
    valid (bool): Whether the OTP is valid.
    error_code (str | None): Machine-readable error code.
    message (str | None): Human-friendly error message.
    otp (EmailOTP | None): The OTP instance, if found.
  """

  __slots__ = ("valid", "error_code", "message", "otp")

  def __init__(self, valid: bool, error_code=None, message=None, otp=None):
    self.valid = valid
    self.error_code = error_code
    self.message = message
    self.otp = otp


def validate_otp(email: str, purpose: str, code: str) -> OTPValidationResult:
  """
  Validate a 4-digit OTP for the given email and purpose.
  
  Behavior:
  - Normalizes email and code.
  - If no OTP exists or all are invalid/used/expired → invalid_code.
  - If OTP is expired → code_expired (and mark as used/expired).
  - If OTP is locked (attempt_count >= max_attempts) → too_many_attempts.
  - If code mismatch → increment attempt_count; if exceeds max_attempts, lock and return too_many_attempts; else invalid_code.
  - If code matches and OTP is still valid → mark used and return success.
  """
  normalized_email = (email or "").strip().lower()
  normalized_code = (code or "").strip()

  if not normalized_email or not normalized_code:
    return OTPValidationResult(
      valid=False,
      error_code="invalid_code",
      message="Invalid code. Please check the code and try again.",
      otp=None,
    )

  try:
    otp = (
      EmailOTP.objects.filter(
        email=normalized_email,
        purpose=purpose,
      )
      .order_by("-created_at")
      .first()
    )
  except EmailOTP.DoesNotExist:
    otp = None

  if not otp:
    return OTPValidationResult(
      valid=False,
      error_code="invalid_code",
      message="The code you entered is incorrect. Please try again.",
      otp=None,
    )

  # Expired codes
  if otp.is_expired:
    # Mark as used/expired to avoid reuse
    if not otp.used:
      otp.used = True
      otp.save(update_fields=["used"])
    return OTPValidationResult(
      valid=False,
      error_code="code_expired",
      message="This code has expired. Please request a new one.",
      otp=otp,
    )

  # Locked codes (too many invalid attempts)
  if otp.is_locked:
    return OTPValidationResult(
      valid=False,
      error_code="too_many_attempts",
      message="Too many incorrect attempts. This code is no longer valid. Please request a new code.",
      otp=otp,
    )

  # Code mismatch
  if otp.code != normalized_code:
    otp.attempt_count += 1
    otp.save(update_fields=["attempt_count"])

    if otp.is_locked:
      return OTPValidationResult(
        valid=False,
        error_code="too_many_attempts",
        message="Too many incorrect attempts. This code is no longer valid. Please request a new code.",
        otp=otp,
      )

    return OTPValidationResult(
      valid=False,
      error_code="invalid_code",
      message="The code you entered is incorrect. Please try again.",
      otp=otp,
    )

  # Code matches and is usable
  otp.used = True
  otp.save(update_fields=["used"])

  return OTPValidationResult(
    valid=True,
    error_code=None,
    message=None,
    otp=otp,
  )


