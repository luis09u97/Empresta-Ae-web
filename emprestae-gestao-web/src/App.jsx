
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  async function handleLogin(e) {
    e.preventDefault()

    setLoading(true)
    setLoadingStep('Autenticando sua conta...')
    setMessage('')
    setMessageType('')

    try {
      // 1. Autenticação
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      const userId = data.user.id

      // 2. Verificações simultâneas
      setLoadingStep('Verificando permissões de acesso...')

      const [usuarioResult, perfilResult] = await Promise.all([
        supabase
          .from('usuarios')
          .select('ativo')
          .eq('id_usuario', userId)
          .maybeSingle(),

        supabase
          .from('usuario_perfil')
          .select('perfis(nome_perfil)')
          .eq('id_usuario', userId)
      ])

      if (usuarioResult.error) throw usuarioResult.error
      if (perfilResult.error) throw perfilResult.error

      const usuario = usuarioResult.data
      const perfisUsuario = perfilResult.data

      if (!usuario || !usuario.ativo) {
        await supabase.auth.signOut()
        throw new Error('Seu usuário está inativo ou não foi cadastrado corretamente.')
      }

      const possuiGestao = perfisUsuario?.some(
        item => item.perfis?.nome_perfil === 'Gestão'
      )

      if (!possuiGestao) {
        await supabase.auth.signOut()
        throw new Error('Acesso negado. Esta área é exclusiva da Gestão escolar.')
      }

      setMessageType('success')
      setMessage('Login realizado com sucesso! Bem-vindo ao Emprestaê Jovem.')
      
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Não foi possível realizar o login.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  async function handlePasswordRecovery() {
    if (!email) {
      setMessageType('error')
      setMessage('Digite seu e-mail para receber o link de recuperação.')
      return
    }

    setLoading(true)
    setLoadingStep('Enviando solicitação...')
    setMessage('')
    setMessageType('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })

      if (error) throw error

      setMessageType('success')
      setMessage('Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <main className="page">
      <section className="login-container">

        <div className="welcome-panel">
          <div className="graduation-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3 1 8.5 12 14l9-4.5V16h2V8.5L12 3Zm-7 9.3V17c3.8 3.2 10.2 3.2 14 0v-4.7l-7 3.5-7-3.5Z"/>
            </svg>
          </div>

          <div className="welcome-text">
            <h1>Emprestaê<br />Jovem.</h1>
            <p>
              Uma plataforma inteligente para
              facilitar a gestão dos equipamentos
              escolares.
            </p>
          </div>

          <span className="welcome-footer">
            Organização, controle e praticidade.
          </span>
        </div>

        <div className="form-panel">
          <div className="form-content">

            <h2>Bem-vindo!</h2>
            <p className="form-subtitle">
              Entre com sua conta para acessar o painel.
            </p>

            <div className="access-type">
              <span>♛</span>
              <strong>Gestão escolar</strong>
            </div>

            <form onSubmit={handleLogin}>
              <label htmlFor="email">E-mail da Gestão</label>
              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />

              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />

              <div className="forgot-password">
                <a
                  href="#recuperar"
                  onClick={(e) => {
                    e.preventDefault()
                    if (!loading) handlePasswordRecovery()
                  }}
                >
                  Esqueceu sua senha?
                </a>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Verificando...
                  </>
                ) : (
                  <>Entrar no sistema <span>→</span></>
                )}
              </button>
            </form>

            {loading && (
              <div className="login-status loading-status">
                <span className="status-spinner"></span>
                <span>{loadingStep}</span>
              </div>
            )}

            {!loading && message && (
              <div
                className={`login-status ${messageType}-status`}
                role="status"
                aria-live="polite"
              >
                <span className="status-icon">
                  {messageType === 'success' ? '✓' : '⚠'}
                </span>
                <span>{message}</span>
              </div>
            )}

            <p className="security-text">
              <span>🔒</span> Acesso exclusivo para a Gestão escolar.
            </p>

          </div>
        </div>

      </section>

      <footer>
        Emprestaê Jovem © 2026
      </footer>
    </main>
  )
}

export default App
