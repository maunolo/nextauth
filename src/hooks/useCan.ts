import { useAuth } from '../contexts/AuthContext'
import { validateUserPermission } from '../utils/validateUserPermissions'

interface UsaCanParams {
  permissions?: string[]
  roles?: string[]
}

export function useCan({ permissions, roles }: UsaCanParams) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return false
  }

  const userHasValidPermissions = validateUserPermission({
    user,
    permissions,
    roles
  })

  return userHasValidPermissions
}
