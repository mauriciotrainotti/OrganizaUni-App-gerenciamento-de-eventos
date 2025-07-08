import React, { useState, useEffect } from 'react';
import './App.css'; // Importa o arquivo CSS

// Dados de exemplo para eventos e tipos de evento
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

// Componente principal do aplicativo
function App() {
  // Estado para controlar a página atual (admin ou participante)
  const [currentPage, setCurrentPage] = useState('participante'); // Inicia na visão de participante
  // Estado para armazenar os eventos (dados simulados em memória)
  const [events, setEvents] = useState([]);
  // Estado para armazenar o evento atualmente selecionado para edição
  const [editingEvent, setEditingEvent] = useState(null);
  // Estado para controlar a visibilidade do modal de detalhes/inscrição
  const [showEventModal, setShowEventModal] = useState(false);
  // Estado para o evento selecionado no modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Estado para a mensagem de confirmação
  const [message, setMessage] = useState('');
  // Estado para controlar a visibilidade do modal de confirmação
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Efeito para carregar dados iniciais (simulados)
  useEffect(() => {
    // Carrega eventos do localStorage se existirem, caso contrário, usa um array vazio
    const storedEvents = JSON.parse(localStorage.getItem('organizauni_events')) || [];
    setEvents(storedEvents);
  }, []);

  // Efeito para salvar eventos no localStorage sempre que o estado 'events' mudar
  useEffect(() => {
    localStorage.setItem('organizauni_events', JSON.stringify(events));
  }, [events]);

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

  // Função para adicionar ou atualizar um evento
  const handleSaveEvent = (eventData) => {
    if (eventData.id) {
      // Atualiza evento existente
      setEvents(events.map((e) => (e.id === eventData.id ? eventData : e)));
      openMessageModal('Evento atualizado com sucesso!');
    } else {
      // Adiciona novo evento com um ID único e inicializa inscrições
      const newEvent = {
        ...eventData,
        id: Date.now(), // ID simples baseado no timestamp
        inscricoes: [], // Array para armazenar inscrições
        vagasDisponiveis: eventData.vagasDisponiveis, // Garante que vagasDisponiveis seja um número
      };
      setEvents([...events, newEvent]);
      openMessageModal('Evento cadastrado com sucesso!');
    }
    setEditingEvent(null); // Limpa o evento em edição
  };

  // Função para excluir um evento
  const handleDeleteEvent = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      setEvents(events.filter((e) => e.id !== id));
      openMessageModal('Evento excluído com sucesso!');
    }
  };

  // Função para publicar/despublicar um evento
  const handleTogglePublish = (id) => {
    setEvents(
      events.map((e) =>
        e.id === id
          ? {
              ...e,
              status:
                e.status === 'Aberto para Inscrições'
                  ? 'Rascunho'
                  : 'Aberto para Inscrições',
            }
          : e
      )
    );
    openMessageModal('Status do evento atualizado!');
  };

  // Função para abrir o modal de detalhes do evento
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Função para fechar o modal de detalhes do evento
  const closeEventDetails = () => {
    setSelectedEvent(null);
    setShowEventModal(false);
  };

  // Função para lidar com a inscrição em um evento
  const handleRegister = (eventId, participantData) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          if (event.inscricoes.length < event.vagasDisponiveis) {
            const newInscricoes = [...event.inscricoes, participantData];
            openMessageModal('Inscrição realizada com sucesso!');
            return { ...event, inscricoes: newInscricoes };
          } else {
            openMessageModal('Desculpe, as vagas para este evento estão esgotadas.');
          }
        }
        return event;
      })
    );
    closeEventDetails(); // Fecha o modal após a inscrição
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
        imagemBanner: '',
        departamento: '',
        inscricoes: [], // Inicializa como array vazio
      }
    );

    // Atualiza o estado do formulário quando o evento de edição muda
    useEffect(() => {
      setFormData(
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
          imagemBanner: '',
          departamento: '',
          inscricoes: [],
        }
      );
    }, [event]);

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      // Validação básica
      if (
        !formData.titulo ||
        !formData.dataInicio ||
        !formData.dataFim ||
        !formData.local ||
        !formData.vagasDisponiveis
      ) {
        openMessageModal('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      onSave(formData);
    };

    return (
      <div className="form-container">
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
              URL da Imagem de Destaque/Banner
            </label>
            <input
              type="url"
              id="imagemBanner"
              name="imagemBanner"
              value={formData.imagemBanner}
              onChange={handleChange}
              className="form-input"
            />
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
      <div className="admin-list-container">
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
            onClick={() => setEditingEvent({})} // Inicia um novo cadastro
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
                    <td className="table-cell">{event.inscricoes.length}</td>
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
        <div className="inscricoes-modal-content">
          <h2 className="section-title">
            Inscritos para: {event.titulo}
          </h2>
          {event.inscricoes.length === 0 ? (
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

    const vagasRestantes = event.vagasDisponiveis - event.inscricoes.length;
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
      <div className="participant-list-container">
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
                    <span className="event-detail-label">Tipo:</span> {event.tipo}
                  </p>
                  <p className="event-card-text">
                    <span className="event-detail-label">Data:</span>{' '}
                    {new Date(event.dataInicio).toLocaleDateString()}
                  </p>
                  <p className="event-card-text">
                    <span className="event-detail-label">Local:</span> {event.local}
                  </p>
                  <p className="event-card-text">
                    <span className="event-detail-label">Vagas:</span>{' '}
                    {event.vagasDisponiveis - event.inscricoes.length} de {event.vagasDisponiveis} restantes
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
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">OrganizaUni</h1>
          <nav className="nav-buttons">
            <button
              onClick={() => setCurrentPage('participante')}
              className={`nav-button ${
                currentPage === 'participante' ? 'nav-button-active' : ''
              }`}
            >
              Portal do Participante
            </button>
            <button
              onClick={() => setCurrentPage('admin')}
              className={`nav-button ${
                currentPage === 'admin' ? 'nav-button-active' : ''
              }`}
            >
              Administração
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {currentPage === 'admin' && (
          <>
            {editingEvent ? (
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
                onViewInscricoes={setSelectedEvent} // Passa o evento para o estado de seleção
              />
            )}
          </>
        )}

        {currentPage === 'participante' && (
          <ParticipantEventList events={events} onSelectEvent={openEventDetails} />
        )}
      </main>

      {/* Modal de Detalhes/Inscrição para Participantes */}
      {showEventModal && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={closeEventDetails}
          onRegister={handleRegister}
        />
      )}

      {/* Modal de Lista de Inscritos para Admin */}
      {selectedEvent && currentPage === 'admin' && (
        <InscricoesList event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Modal de Mensagem */}
      {showMessageModal && <MessageModal message={message} onClose={closeMessageModal} />}
    </div>
  );
}

export default App;
