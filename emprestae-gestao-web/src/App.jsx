
import './App.css'

function App() {
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

            <form onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="email">E-mail da Gestão</label>
              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                required
              />

              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                required
              />

              <div className="forgot-password">
                <a href="#recuperar">Esqueceu sua senha?</a>
              </div>

              <button type="submit">
                Entrar no sistema <span>→</span>
              </button>
            </form>

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
