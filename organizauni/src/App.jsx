import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import {
  db,
  auth,
  appId,
  initializeAuth,
  loginWithGoogle,
  registerWithEmail,
  loginWithEmail,
  logout
} from './firebaseconfig'; // Importa as novas funções de autenticação
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Dados de exemplo para tipos de evento e status
const eventTypes = [
  'Palestra',
  'Semana Acadêmica',
  'Workshop',
  'Seminário',
  'Conferência',
  'Outro',
];

const eventStatuses = [
  'Rascunho',
  'Aberto para Inscrições',
  'Encerrado',
  'Cancelado',
];

// Componente para o formulário de autenticação (Login/Registro)
const AuthForm = ({ openMessageModal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook para navegação

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerWithEmail(email, password);
      openMessageModal('Registro realizado com sucesso! Você está logado.');
      navigate('/admin'); // Redireciona para a página de administração após o registro
    } catch (error) {
      openMessageModal(`Erro no registro: ${error.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      openMessageModal('Login realizado com sucesso!');
      navigate('/admin'); // Redireciona para a página de administração após o login
    } catch (error) {
      openMessageModal(`Erro no login: ${error.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      openMessageModal('Login com Google realizado com sucesso!');
      navigate('/admin'); // Redireciona para a página de administração após o login
    } catch (error) {
      openMessageModal(`Erro no login com Google: ${error.message}`);
    }
  };

  return (
    <div className="auth-page-container"> {/* Novo container para a página de auth */}
      <div className="content-card auth-form-container">
        <h2 className="section-title">Acesso Administrativo</h2>
        <form onSubmit={handleLogin} className="form-grid auth-grid">
          <div>
            <label htmlFor="email" className="form-label">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="md-col-span-2 form-actions auth-actions">
            <button type="submit" className="button-primary">
              Entrar
            </button>
            <button type="button" onClick={handleRegister} className="button-secondary">
              Registrar
            </button>
          </div>
        </form>
        <div className="auth-separator">
          <span>OU</span>
        </div>
        <button onClick={handleGoogleLogin} className="button-google">
          Entrar com Google
        </button>
      </div>
    </div>
  );
};

// NOVO COMPONENTE: Para lidar com o status de autenticação e botão de logout
const AuthStatusAndLogoutButton = ({ currentUser, openMessageModal }) => {
  const navigate = useNavigate(); // useNavigate agora está dentro de um componente filho de BrowserRouter

  const handleLogout = async () => {
    try {
      await logout();
      openMessageModal('Logout realizado com sucesso!');
      navigate('/participante'); // Redireciona para a página de participante após o logout
    } catch (error) {
      openMessageModal(`Erro ao fazer logout: ${error.message}`);
    }
  };

  return (
    <>
      {currentUser && ( // Mostra o botão de logout se houver um usuário logado
        <button onClick={handleLogout} className="nav-button">
          Sair ({currentUser.email || 'Anônimo'})
        </button>
      )}
    </>
  );
};


// Componente principal do aplicativo
function App() {
  // Estado para armazenar os eventos
  const [events, setEvents] = useState([]);
  // Estado para armazenar o evento atualmente selecionado para edição
  const [editingEvent, setEditingEvent] = useState(null);
  // Estado para controlar a visibilidade do modal de detalhes/inscrição (para participante)
  const [showEventModal, setShowEventModal] = useState(false);
  // Estado para o evento selecionado no modal de detalhes (para participante)
  const [selectedEvent, setSelectedEvent] = useState(null);
  // NOVO ESTADO: para o evento selecionado para ver inscrições (para admin)
  const [eventToViewInscricoes, setEventToViewInscricoes] = useState(null);
  // Estado para a mensagem de confirmação
  const [message, setMessage] = useState('');
  // Estado para controlar a visibilidade do modal de confirmação
  const [showMessageModal, setShowMessageModal] = useState(false);
  // Estado para armazenar o ID do usuário autenticado
  const [userId, setUserId] = useState(null);
  // Estado para saber quando a autenticação está pronta
  const [isAuthReady, setIsAuthReady] = useState(false);
  // NOVO: Estado para armazenar o usuário logado
  const [currentUser, setCurrentUser] = useState(null);
  // REMOVIDO: const navigate = useNavigate(); // Este hook não pode ser chamado aqui


  // Efeito para inicializar a autenticação Firebase e configurar o listener de estado de autenticação
  useEffect(() => {
    initializeAuth(); // Chama a função de inicialização de autenticação

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setCurrentUser(user); // Define o usuário logado
      } else {
        setUserId(crypto.randomUUID()); // Gera um UUID aleatório para usuários não autenticados
        setCurrentUser(null); // Limpa o usuário logado
      }
      setIsAuthReady(true); // Marca a autenticação como pronta
    });

    return () => unsubscribeAuth(); // Limpa o listener ao desmontar o componente
  }, []); // Executa apenas uma vez na montagem inicial

  // Efeito para redirecionar se o usuário tentar acessar /admin sem autenticação
  // Este useEffect agora está em AuthRedirector, que é um componente filho de BrowserRouter
  // e, portanto, pode usar useNavigate.

  // Efeito para carregar eventos do Firestore (executa apenas quando a autenticação está pronta)
  useEffect(() => {
    // Só tenta carregar se a autenticação estiver pronta e userId existir
    if (!isAuthReady || !userId) {
      console.log("Autenticação não pronta ou userId ausente, pulando a busca de eventos.");
      return;
    }

    // Caminho da coleção para dados públicos (eventos)
    const eventsCollectionRef = collection(db, `artifacts/${appId}/public/data/events`);

    // Listener em tempo real para a coleção de eventos
    const unsubscribeFirestore = onSnapshot(eventsCollectionRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(fetchedEvents);
      console.log("[App] Eventos carregados do Firestore (raw):", fetchedEvents); // Log de dados brutos do Firestore
    }, (error) => {
      console.error("Erro ao buscar eventos do Firestore:", error);
      openMessageModal('Erro ao carregar eventos. Verifique sua conexão ou permissões.');
    });

    return () => unsubscribeFirestore(); // Limpa o listener ao desmontar
  }, [db, isAuthReady, userId, appId]); // Dependências para re-executar o efeito

  // Função para abrir o modal de mensagem
  const openMessageModal = (msg) => {
    setMessage(msg);
    setShowMessageModal(true);
  };

  // Função para fechar o modal de mensagem
  const closeMessageModal = () => {
    setShowMessageModal(false);
    setMessage('');
  };

  // Função para adicionar ou atualizar um evento no Firestore
  const handleSaveEvent = async (eventData) => {
    if (!isAuthReady || !currentUser || currentUser.isAnonymous) { // Requer usuário autenticado (NÃO anônimo) para salvar
      openMessageModal('Você precisa estar logado com uma conta de administrador para realizar esta ação.');
      return;
    }

    try {
      if (eventData.id && typeof eventData.id === 'string') {
        const eventRef = doc(db, `artifacts/${appId}/public/data/events`, eventData.id);
        await updateDoc(eventRef, eventData);
        openMessageModal('Evento atualizado com sucesso no Firestore!');
      } else {
        const eventsCollectionRef = collection(db, `artifacts/${appId}/public/data/events`);
        await addDoc(eventsCollectionRef, { ...eventData, inscricoes: [] });
        openMessageModal('Evento cadastrado com sucesso no Firestore!');
      }
      setEditingEvent(null);
    } catch (error) {
      console.error("Erro ao salvar evento no Firestore:", error);
      openMessageModal('Erro ao salvar evento. Verifique o console e as regras de segurança do Firebase.');
    }
  };

  // Função para excluir um evento do Firestore
  const handleDeleteEvent = async (id) => {
    if (!isAuthReady || !currentUser || currentUser.isAnonymous) { // Requer usuário autenticado (NÃO anônimo) para excluir
      openMessageModal('Você precisa estar logado com uma conta de administrador para realizar esta ação.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        const eventRef = doc(db, `artifacts/${appId}/public/data/events`, id);
        await deleteDoc(eventRef);
        openMessageModal('Evento excluído com sucesso do Firestore!');
      } catch (error) {
        console.error("Erro ao excluir evento do Firestore:", error);
        openMessageModal('Erro ao excluir evento. Verifique o console e as regras de segurança do Firebase.');
      }
    }
  };

  // Função para publicar/despublicar um evento (atualiza o status no Firestore)
  const handleTogglePublish = async (id) => {
    if (!isAuthReady || !currentUser || currentUser.isAnonymous) { // Requer usuário autenticado (NÃO anônimo) para publicar/despublicar
      openMessageModal('Você precisa estar logado com uma conta de administrador para realizar esta ação.');
      return;
    }
    try {
      const eventRef = doc(db, `artifacts/${appId}/public/data/events`, id);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const currentStatus = eventDoc.data().status;
        const newStatus = currentStatus === 'Aberto para Inscrições' ? 'Rascunho' : 'Aberto para Inscrições';
        await updateDoc(eventRef, { status: newStatus });
        openMessageModal(`Status do evento atualizado para: ${newStatus}!`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status do evento no Firestore:", error);
      openMessageModal('Erro ao atualizar status. Verifique o console e as regras de segurança do Firebase.');
    }
  };

  // Função para abrir o modal de detalhes do evento (para participante)
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Função para fechar o modal de detalhes do evento (para participante)
  const closeEventDetails = () => {
    setSelectedEvent(null);
    setShowEventModal(false);
  };

  // Função para lidar com a inscrição em um evento (atualiza o array de inscrições no Firestore)
  const handleRegister = async (eventId, participantData) => {
    if (!isAuthReady || !userId) { // A inscrição não requer um currentUser, apenas que a autenticação esteja pronta
      openMessageModal('Autenticação não pronta. Tente novamente.');
      return;
    }

    try {
      const eventRef = doc(db, `artifacts/${appId}/public/data/events`, eventId);
      const eventDoc = await getDoc(eventRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const currentInscricoes = eventData.inscricoes || [];

        if (currentInscricoes.length < eventData.vagasDisponiveis) {
          const newInscricoes = [...currentInscricoes, participantData];
          await updateDoc(eventRef, { inscricoes: newInscricoes });
          openMessageModal('Inscrição realizada com sucesso!');
        } else {
          openMessageModal('Desculpe, as vagas para este evento estão esgotadas.');
        }
      } else {
        openMessageModal('Evento não encontrado.');
      }
      closeEventDetails();
    } catch (error) {
      console.error("Erro ao registrar no evento no Firestore:", error);
      openMessageModal('Erro ao registrar. Verifique o console e as regras de segurança do Firebase.');
    }
  };

  // Componente de Mensagem Modal
  const MessageModal = ({ message, onClose }) => (
    <div className="modal-overlay">
      <div className="message-modal-content">
        <p className="message-text">{message}</p>
        <button
          onClick={onClose}
          className="button-primary"
        >
          OK
        </button>
      </div>
    </div>
  );

  // Componente para o formulário de evento (Cadastro/Edição)
  const EventForm = ({ event, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
      event || {
        titulo: '',
        tipo: eventTypes[0],
        descricao: '',
        dataInicio: '',
        dataFim: '',
        local: '',
        palestrantes: '',
        vagasDisponiveis: 0,
        status: eventStatuses[0],
        requisitosInscricao: '',
        imagemBanner: '', // Valor inicial vazio para ser opcional
        departamento: '',
      }
    );

    useEffect(() => {
      // Garante que 'tipo' sempre tenha um valor válido ao carregar/resetar o formulário
      const initialType = (event && event.tipo !== undefined) ? event.tipo : eventTypes[0];
      const newFormData = event
        ? { ...event, tipo: initialType }
        : {
            titulo: '',
            tipo: initialType, // Garante que o tipo seja 'Palestra' por padrão
            descricao: '',
            dataInicio: '',
            dataFim: '',
            local: '',
            palestrantes: '',
            vagasDisponiveis: 0,
            status: eventStatuses[0],
            requisitosInscricao: '',
            imagemBanner: '',
            departamento: '',
          };
      console.log("[EventForm] Initializing formData with tipo:", newFormData.tipo);
      setFormData(newFormData);
    }, [event]);

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      console.log(`[EventForm] handleChange - Name: ${name}, Value: "${value}"`); // Log detalhado
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : (typeof value === 'string' ? value.trim() : value), // Adicionado .trim()
      });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("[EventForm] Submitting formData.tipo:", formData.tipo); // Log antes de salvar
      if (
        !formData.titulo ||
        !formData.dataInicio ||
        !formData.dataFim ||
        !formData.local ||
        !formData.vagasDisponiveis ||
        formData.vagasDisponiveis < 0
      ) {
        openMessageModal('Por favor, preencha todos os campos obrigatórios e garanta que as vagas sejam um número positivo.');
        return;
      }
      onSave(formData);
    };

    return (
      <div className="content-card">
        <h2 className="section-title">
          {event ? 'Editar Evento' : 'Cadastrar Novo Evento'}
        </h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label htmlFor="titulo" className="form-label">
              Título do Evento
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="tipo" className="form-label">
              Tipo de Evento
            </label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="form-select"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="md-col-span-2">
            <label htmlFor="descricao" className="form-label">
              Descrição Detalhada
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows="3"
              className="form-textarea"
            ></textarea>
          </div>
          <div>
            <label htmlFor="dataInicio" className="form-label">
              Data e Hora de Início
            </label>
            <input
              type="datetime-local"
              id="dataInicio"
              name="dataInicio"
              value={formData.dataInicio}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="dataFim" className="form-label">
              Data e Hora de Fim
            </label>
            <input
              type="datetime-local"
              id="dataFim"
              name="dataFim"
              value={formData.dataFim}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="local" className="form-label">
              Local
            </label>
            <input
              type="text"
              id="local"
              name="local"
              value={formData.local}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="palestrantes" className="form-label">
              Palestrante(s)/Apresentador(es)
            </label>
            <input
              type="text"
              id="palestrantes"
              name="palestrantes"
              value={formData.palestrantes}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="vagasDisponiveis" className="form-label">
              Vagas Disponíveis
            </label>
            <input
              type="number"
              id="vagasDisponiveis"
              name="vagasDisponiveis"
              value={formData.vagasDisponiveis}
              onChange={handleChange}
              min="0"
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="status" className="form-label">
              Status do Evento
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              {eventStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="md-col-span-2">
            <label htmlFor="requisitosInscricao" className="form-label">
              Requisitos de Inscrição (Informações adicionais)
            </label>
            <input
              type="text"
              id="requisitosInscricao"
              name="requisitosInscricao"
              value={formData.requisitosInscricao}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="md-col-span-2">
            <label htmlFor="imagemBanner" className="form-label">
              Imagem de Destaque/Banner (URL ou Anexo - Opcional)
            </label>
            <input
              type="text"
              id="imagemBanner"
              name="imagemBanner"
              value={formData.imagemBanner}
              onChange={handleChange}
              className="form-input"
            />
            <p className="text-sm text-gray-500 mt-1">
              * Para anexos, insira um texto descritivo. A funcionalidade de upload de arquivo real não é suportada neste ambiente.
            </p>
          </div>
          <div className="md-col-span-2">
            <label htmlFor="departamento" className="form-label">
              Área/Departamento Responsável
            </label>
            <input
              type="text"
              id="departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="md-col-span-2 form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary"
            >
              {event ? 'Salvar Alterações' : 'Cadastrar Evento'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Componente para a lista de eventos no Back-office
  const AdminEventList = ({ events, onEdit, onDelete, onTogglePublish, onViewInscricoes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos');

    const filteredEvents = events.filter((event) => {
      const matchesSearch = event.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'Todos' || event.tipo === filterType;
      return matchesSearch && matchesType;
    });

    return (
      <div className="content-card">
        <h2 className="section-title">Gestão de Eventos</h2>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="Todos">Todos os Tipos</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={() => setEditingEvent({})
            } // Inicia um novo cadastro
            className="button-add-event"
          >
            Cadastrar Novo Evento
          </button>
        </div>

        {filteredEvents.length === 0 ? (
          <p className="no-events-message">Nenhum evento encontrado.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Título</th>
                  <th className="table-header-cell">Tipo</th>
                  <th className="table-header-cell">Data</th>
                  <th className="table-header-cell">Local</th>
                  <th className="table-header-cell">Vagas</th>
                  <th className="table-header-cell">Inscritos</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="table-row">
                    <td className="table-cell-title">{event.titulo}</td>
                    <td className="table-cell">{event.tipo}</td>
                    <td className="table-cell">
                      {new Date(event.dataInicio).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{event.local}</td>
                    <td className="table-cell">{event.vagasDisponiveis}</td>
                    <td className="table-cell">{event.inscricoes ? event.inscricoes.length : 0}</td>
                    <td className="table-cell">{event.status}</td>
                    <td className="table-cell">
                      <div className="table-actions">
                        <button
                          onClick={() => onEdit(event)}
                          className="button-edit"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(event.id)}
                          className="button-delete"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => onTogglePublish(event.id)}
                          className={
                            event.status === 'Aberto para Inscrições'
                              ? 'button-publish'
                              : 'button-unpublish'
                          }
                        >
                          {event.status === 'Aberto para Inscrições' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          onClick={() => onViewInscricoes(event)}
                          className="button-view-inscritos"
                        >
                          Inscritos
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Componente para a lista de inscritos de um evento
  const InscricoesList = ({ event, onClose }) => {
    if (!event) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content inscricoes-modal-content">
          <h2 className="section-title">
            Inscritos para: {event.titulo}
          </h2>
          {(!event.inscricoes || event.inscricoes.length === 0) ? (
            <p className="no-events-message">Nenhuma inscrição ainda.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Nome</th>
                    <th className="table-header-cell">E-mail</th>
                    <th className="table-header-cell">Matrícula</th>
                    <th className="table-header-cell">Curso</th>
                  </tr>
                </thead>
                <tbody>
                  {event.inscricoes.map((inscrito, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell">{inscrito.nomeCompleto}</td>
                      <td className="table-cell">{inscrito.email}</td>
                      <td className="table-cell">{inscrito.matricula}</td>
                      <td className="table-cell">{inscrito.curso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions">
            <button
              onClick={onClose}
              className="button-primary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente para o modal de detalhes e inscrição do evento (Front-office)
  const EventDetailsModal = ({ event, onClose, onRegister }) => {
    const [participantData, setParticipantData] = useState({
      nomeCompleto: '',
      email: '',
      matricula: '',
      curso: '',
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setParticipantData({ ...participantData, [name]: value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!participantData.nomeCompleto || !participantData.email || !participantData.matricula || !participantData.curso) {
        openMessageModal('Por favor, preencha todos os campos para a inscrição.');
        return;
      }
      onRegister(event.id, participantData);
      setParticipantData({ nomeCompleto: '', email: '', matricula: '', curso: '' }); // Limpa o formulário
    };

    if (!event) return null;

    const vagasRestantes = event.vagasDisponiveis - (event.inscricoes ? event.inscricoes.length : 0);
    const isFull = vagasRestantes <= 0;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2 className="event-details-title">{event.titulo}</h2>
          {event.imagemBanner && (
            <img
              src={event.imagemBanner}
              alt={event.titulo}
              className="event-banner-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/600x200/cccccc/333333?text=Imagem+N%C3%A3o+Dispon%C3%ADvel`;
              }}
            />
          )}
          <p className="event-detail-text">
            <span className="event-detail-label">Tipo:</span> {event.tipo}
          </p>
          <p className="event-detail-text">
            <span className="event-detail-label">Descrição:</span> {event.descricao}
          </p>
          <p className="event-detail-text">
            <span className="event-detail-label">Data:</span>{' '}
            {new Date(event.dataInicio).toLocaleString()} -{' '}
            {new Date(event.dataFim).toLocaleString()}
          </p>
          <p className="event-detail-text">
            <span className="event-detail-label">Local:</span> {event.local}
          </p>
          <p className="event-detail-text">
            <span className="event-detail-label">Palestrante(s):</span> {event.palestrantes || 'Não informado'}
          </p>
          <p className="event-detail-text">
            <span className="event-detail-label">Vagas:</span> {vagasRestantes} de {event.vagasDisponiveis} restantes
          </p>
          <p className="event-detail-text">
            <span className="event-detail-label">Departamento:</span> {event.departamento || 'Não informado'}
          </p>

          {event.status === 'Aberto para Inscrições' && !isFull && (
            <div className="registration-section">
              <h3 className="registration-title">Inscreva-se neste evento</h3>
              <form onSubmit={handleSubmit} className="form-grid">
                <div>
                  <label htmlFor="nomeCompleto" className="form-label">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nomeCompleto"
                    name="nomeCompleto"
                    value={participantData.nomeCompleto}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="form-label">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={participantData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="matricula" className="form-label">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    id="matricula"
                    name="matricula"
                    value={participantData.matricula}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="curso" className="form-label">
                    Curso
                  </label>
                  <input
                    type="text"
                    id="curso"
                    name="curso"
                    value={participantData.curso}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="md-col-span-2 form-actions">
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Confirmar Inscrição
                  </button>
                </div>
              </form>
            </div>
          )}
          {isFull && event.status === 'Aberto para Inscrições' && (
            <p className="full-message">
              Vagas esgotadas para este evento.
            </p>
          )}
          {event.status !== 'Aberto para Inscrições' && (
            <p className="status-message">
              Inscrições {event.status === 'Encerrado' ? 'encerradas' : 'não abertas'} para este evento.
            </p>
          )}

          <div className="form-actions">
            <button
              onClick={onClose}
              className="button-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente para a lista de eventos para participantes (Front-office)
  const ParticipantEventList = ({ events, onSelectEvent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos');

    const filteredEvents = events.filter((event) => {
      const matchesSearch = event.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'Todos' || event.tipo === filterType;
      // Apenas mostra eventos que estão "Aberto para Inscrições"
      return matchesSearch && matchesType && event.status === 'Aberto para Inscrições';
    });

    return (
      <div className="content-card">
        <h2 className="section-title">Eventos Disponíveis</h2>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="Todos">Todos os Tipos</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {filteredEvents.length === 0 ? (
          <p className="no-events-message">Nenhum evento disponível para inscrição no momento.</p>
        ) : (
          <div className="event-card-grid">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="event-card"
              >
                {event.imagemBanner && (
                  <img
                    src={event.imagemBanner}
                    alt={event.titulo}
                    className="event-card-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/400x160/cccccc/333333?text=Imagem+N%C3%A3o+Dispon%C3%ADvel`;
                    }}
                  />
                )}
                <div className="event-card-body">
                  <h3 className="event-card-title">{event.titulo}</h3>
                  <p className="event-card-text">
                    <span className="event-detail-label">Tipo:</span> {event.tipo || 'Não informado'}
                  </p>
                  {/* Adicionado console.log para verificar o valor do tipo ao renderizar */}
                  {console.log(`[ParticipantEventList] Evento ID: ${event.id}, Tipo: "${event.tipo}"`)}
                  <p className="event-card-text">
                    <span className="event-detail-label">Data:</span>{' '}
                    {new Date(event.dataInicio).toLocaleDateString()}
                  </p>
                  <p className="event-card-text">
                    <span className="event-detail-label">Local:</span> {event.local}
                  </p>
                  <p className="event-card-text">
                    <span className="event-detail-label">Vagas:</span>{' '}
                    {event.vagasDisponiveis - (event.inscricoes ? event.inscricoes.length : 0)} de {event.vagasDisponiveis} restantes
                  </p>
                  <button
                    onClick={() => onSelectEvent(event)}
                    className="event-card-button"
                  >
                    Ver Detalhes e Inscrever-se
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderização principal do App
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <h1 className="header-title">OrganizaUni</h1>
            <nav className="nav-buttons">
              <Link to="/participante" className="nav-button">
                Portal do Participante
              </Link>
              <Link to="/admin" className="nav-button">
                Administração
              </Link>
              {/* Renderiza o novo componente AuthStatusAndLogoutButton aqui */}
              <AuthStatusAndLogoutButton currentUser={currentUser} openMessageModal={openMessageModal} />
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ParticipantEventList events={events} onSelectEvent={openEventDetails} />} />
            <Route path="/participante" element={<ParticipantEventList events={events} onSelectEvent={openEventDetails} />} />
            <Route path="/login" element={<AuthForm openMessageModal={openMessageModal} />} /> {/* Nova rota para o formulário de login */}
            <Route
              path="/admin"
              element={
                currentUser && !currentUser.isAnonymous ? ( // AGORA: Verifica se o usuário NÃO é anônimo
                  editingEvent ? (
                    <EventForm
                      event={editingEvent}
                      onSave={handleSaveEvent}
                      onCancel={() => setEditingEvent(null)}
                    />
                  ) : (
                    <AdminEventList
                      events={events}
                      onEdit={setEditingEvent}
                      onDelete={handleDeleteEvent}
                      onTogglePublish={handleTogglePublish}
                      onViewInscricoes={setEventToViewInscricoes} // AQUI: Usa o novo estado para admin
                    />
                  )
                ) : ( // Se não estiver logado ou for anônimo, redireciona para /login
                  <AuthRedirector /> // Componente para redirecionar para /login
                )
              }
            />
          </Routes>
        </main>

        {/* Modais */}
        {showEventModal && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={closeEventDetails}
            onRegister={handleRegister}
          />
        )}

        {/* NOVO: Modal de Lista de Inscritos para Admin, controlado por eventToViewInscricoes */}
        {eventToViewInscricoes && (
          <InscricoesList event={eventToViewInscricoes} onClose={() => setEventToViewInscricoes(null)} />
        )}

        {showMessageModal && <MessageModal message={message} onClose={closeMessageModal} />}
      </div>
    </BrowserRouter>
  );
}

// Componente auxiliar para redirecionar para a página de login
const AuthRedirector = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login');
  }, [navigate]);
  return null; // Não renderiza nada
};

export default App;
