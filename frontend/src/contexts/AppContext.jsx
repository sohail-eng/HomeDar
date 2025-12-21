import { ProductProvider } from './ProductContext'
import { CategoryProvider } from './CategoryContext'
import { FilterProvider } from './FilterContext'
import { SearchProvider } from './SearchContext'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './AuthContext'

/**
 * Main App Context Provider
 * Combines all context providers
 */
export const AppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CategoryProvider>
          <FilterProvider>
            <SearchProvider>
              <ProductProvider>
                {children}
              </ProductProvider>
            </SearchProvider>
          </FilterProvider>
        </CategoryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default AppProvider

