
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
  const [authenticated, setAuthenticated] = useState(false)

  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')

  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  const [dashboardStats, setDashboardStats] = useState({
    professores: 0,
    equipamentos: 0,
    emprestimos: 0,
    manutencao: 0
  })

  // CARREGAR INDICADORES DA GESTÃO
  async function loadDashboardData() {
    setDashboardLoading(true)
    setDashboardError('')

    try {
      const [
        equipamentosResult,
        emprestimosResult,
        manutencaoResult,
        professoresResult
      ] = await Promise.all([
        supabase
          .from('equipamentos')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('emprestimos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Ativo'),

        supabase
          .from('equipamentos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Manutenção'),

        supabase
          .from('usuario_perfil')
          .select('id_usuario, perfis!inner(nome_perfil)')
          .in('perfis.nome_perfil', [
            'Professor FGB',
            'Professor Técnico',
            'PAEET'
          ])
      ])

      if (equipamentosResult.error) throw equipamentosResult.error
      if (emprestimosResult.error) throw emprestimosResult.error
      if (manutencaoResult.error) throw manutencaoResult.error
      if (professoresResult.error) throw professoresResult.error

      const professoresUnicos = new Set(
        professoresResult.data.map(item => item.id_usuario)
      )

      setDashboardStats({
        professores: professoresUnicos.size,
        equipamentos: equipamentosResult.count ?? 0,
        emprestimos: emprestimosResult.count ?? 0,
        manutencao: manutencaoResult.count ?? 0
      })

    } catch (error) {
      console.error('Erro ao carregar painel:', error)
      setDashboardError(
        'Não foi possível carregar os indicadores. Verifique as permissões do banco.'
      )
    } finally {
      setDashboardLoading(false)
    }
  }

  // LOGIN ÚNICO PARA TODOS OS PERFIS
  async function handleLogin(e) {
    e.preventDefault()

    setLoading(true)
    setLoadingStep('Autenticando sua conta...')
    setMessage('')
    setMessageType('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) throw error

      const userId = data.user.id

      setLoadingStep('Verificando seu perfil de acesso...')

      const [usuarioResult, perfilResult] = await Promise.all([
        supabase
          .from('usuarios')
          .select('ativo, nome_completo')
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
      const perfisUsuario = perfilResult.data || []

      if (!usuario || !usuario.ativo) {
        throw new Error(
          'Usuário inativo ou não cadastrado corretamente.'
        )
      }

      if (perfisUsuario.length === 0) {
        throw new Error(
          'Sua conta ainda não possui um perfil de acesso vinculado.'
        )
      }

      const nomesPerfis = perfisUsuario
        .map(item => item.perfis?.nome_perfil)
        .filter(Boolean)

      const perfisPermitidos = [
        'Gestão',
        'Professor FGB',
        'Professor Técnico',
        'PAEET',
        'Suporte Técnico'
      ]

      const perfilEncontrado = nomesPerfis.find(
        perfil => perfisPermitidos.includes(perfil)
      )

      if (!perfilEncontrado) {
        throw new Error(
          'Seu perfil não possui permissão para acessar o sistema.'
        )
      }

      setUserName(usuario.nome_completo || email)
      setUserRole(perfilEncontrado)
      setAuthenticated(true)
      setMessageType('success')
      setMessage('Login realizado com sucesso!')

      if (perfilEncontrado === 'Gestão') {
        loadDashboardData()
      }

    } catch (error) {
      await supabase.auth.signOut()

      setMessageType('error')
      setMessage(error.message || 'Não foi possível realizar o login.')

    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // RECUPERAÇÃO DE SENHA
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
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: window.location.origin
        }
      )

      if (error) throw error

      setMessageType('success')
      setMessage(
        'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.'
      )

    } catch (error) {
      setMessageType('error')
      setMessage(error.message)

    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // SAIR DO SISTEMA
  async function handleLogout() {
    setLoading(true)

    const { error } = await supabase.auth.signOut()

    setLoading(false)

    if (error) {
      setMessageType('error')
      setMessage('Não foi possível sair da conta.')
      return
    }

    setAuthenticated(false)
    setEmail('')
    setPassword('')
    setUserName('')
    setUserRole('')
    setMessage('')
    setMessageType('')
    setDashboardError('')
  }

  // PAINEL DE ACORDO COM O PERFIL
  if (authenticated) {
    const isGestao = userRole === 'Gestão'
    const isSuporte = userRole === 'Suporte Técnico'

    const menu = isGestao
      ? [
          'Início',
          'Professores',
          'Equipamentos',
          'Empréstimos',
          'Defeitos',
          'Auditoria',
          'Configurações'
        ]
      : isSuporte
        ? [
            'Início',
            'Equipamentos',
            'Defeitos',
            'Manutenção',
            'Configurações'
          ]
        : [
            'Início',
            'Solicitar empréstimo',
            'Devolver equipamento',
            'Meus empréstimos',
            'Histórico',
            'Problemas',
            'Manual'
          ]

    return (
      <main className="dashboard-page">

        <header className="dashboard-header">
          <h1>Emprestaê Jovem.</h1>

          <div>
            <span>Olá, {userName}</span>
            <button onClick={handleLogout} disabled={loading}>
              Sair
            </button>
          </div>
        </header>

        <div className="dashboard-layout">

          <aside className="dashboard-sidebar">
            <h3>MENU PRINCIPAL</h3>

            {menu.map(item => (
              <button key={item}>
                {item}
              </button>
            ))}
          </aside>

          <section className="dashboard-content">

            <div className="dashboard-title">
              <div>
                <h2>
                  {isGestao
                    ? 'Visão geral'
                    : isSuporte
                      ? 'Painel de suporte'
                      : 'Painel do professor'}
                </h2>

                <p>
                  Bem-vindo ao Emprestaê Jovem.
                </p>

                <p>
                  Perfil de acesso: <strong>{userRole}</strong>
                </p>
              </div>

              {isGestao && (
                <button
                  className="refresh-button"
                  onClick={loadDashboardData}
                  disabled={dashboardLoading}
                >
                  {dashboardLoading ? 'Atualizando...' : '↻ Atualizar'}
                </button>
              )}
            </div>

            {isGestao && (
              <>
                {dashboardError && (
                  <div className="dashboard-error" role="alert">
                    ⚠ {dashboardError}
                  </div>
                )}

                <div className="dashboard-cards">

                  <article>
                    <span>Professores cadastrados</span>
                    <strong>
                      {dashboardLoading
                        ? '...'
                        : dashboardStats.professores}
                    </strong>
                  </article>

                  <article>
                    <span>Equipamentos cadastrados</span>
                    <strong>
                      {dashboardLoading
                        ? '...'
                        : dashboardStats.equipamentos}
                    </strong>
                  </article>

                  <article>
                    <span>Empréstimos ativos</span>
                    <strong>
                      {dashboardLoading
                        ? '...'
                        : dashboardStats.emprestimos}
                    </strong>
                  </article>

                  <article>
                    <span>Equipamentos em manutenção</span>
                    <strong>
                      {dashboardLoading
                        ? '...'
                        : dashboardStats.manutencao}
                    </strong>
                  </article>

                </div>
              </>
            )}

            {isSuporte && (
              <div className="dashboard-activity">
                <h3>Suporte Técnico</h3>
                <p>
                  Área destinada ao acompanhamento técnico dos equipamentos
                  e das ocorrências do sistema.
                </p>
              </div>
            )}

            {!isGestao && !isSuporte && (
              <div className="dashboard-activity">
                <h3>Área do professor</h3>
                <p>
                  Aqui você poderá consultar seus empréstimos,
                  solicitar equipamentos e registrar problemas.
                </p>
              </div>
            )}

            {isGestao && (
              <div className="dashboard-activity">
                <h3>Atividades recentes</h3>
                <p>
                  Em breve, as movimentações do sistema aparecerão aqui.
                </p>
              </div>
            )}

          </section>
        </div>
      </main>
    )
  }

  // TELA DE LOGIN
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
              Entre com sua conta para acessar o sistema.
            </p>

            <div className="access-type">
              <span>♛</span>
              <strong>Acesso ao Emprestaê Jovem</strong>
            </div>

            <form onSubmit={handleLogin}>

              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />

              <label htmlFor="password">Senha</label>

              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />

              <div className="forgot-password">
                <a
                  href="#recuperar"
                  onClick={e => {
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
              <span>🔒</span> Acesso protegido por perfil de usuário.
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
