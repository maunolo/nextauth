import { AuthProvider } from '../contexts/AuthContext'
import '../styles/globals.scss'

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
