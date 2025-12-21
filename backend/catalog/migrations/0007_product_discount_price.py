# Generated manually for adding discount_price to Product model

from django.db import migrations, models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0006_user_securityquestion_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='discount_price',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Wholesale/discount price for logged-in users. If set, this will be shown to authenticated users.',
                max_digits=10,
                null=True,
                validators=[MinValueValidator(Decimal('0.01'))]
            ),
        ),
    ]

