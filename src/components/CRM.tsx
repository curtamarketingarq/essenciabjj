import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Phone, Mail, Calendar, User, Clock, LogOut, RefreshCw } from 'lucide-react';
import { getTrialRegistrations, updateTrialRegistrationStatus } from '../lib/supabase';
import type { TrialRegistration } from '../lib/supabase';

interface CRMProps {
  onLogout: () => void;
}

interface Lead extends TrialRegistration {
  id: string;
  status: string;
}

const FUNNEL_STAGES = {
  pending: { title: 'Novos Leads', color: 'bg-blue-500' },
  contacted: { title: 'Contatados', color: 'bg-yellow-500' },
  confirmed: { title: 'Confirmados', color: 'bg-green-500' },
  completed: { title: 'Compareceram', color: 'bg-purple-500' },
  enrolled: { title: 'Matriculados', color: 'bg-emerald-500' },
  no_show: { title: 'Não Compareceram', color: 'bg-red-500' },
  cancelled: { title: 'Cancelados', color: 'bg-gray-500' }
};

export default function CRM({ onLogout }: CRMProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const data = await getTrialRegistrations();
      setLeads(data.map(lead => ({ ...lead, id: lead.id!, status: lead.status || 'pending' })));
    } catch (err) {
      setError('Erro ao carregar leads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    
    try {
      await updateTrialRegistrationStatus(draggableId, newStatus);
      
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === draggableId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status do lead');
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Carregando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="https://essenciajj.com/wp-content/uploads/elementor/thumbs/LOGO-ESSENCIA-qjeyis83xh5slrcn7dmtugc7v7ai3ws1g1v29fw7b4.png" 
                alt="Essência BJJ Academy Logo" 
                className="h-8 w-auto mr-3"
              />
              <h1 className="text-2xl font-bold text-gray-900">CRM - Essência BJJ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadLeads}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {Object.entries(FUNNEL_STAGES).map(([status, config]) => (
            <div key={status} className="bg-white rounded-lg shadow p-4">
              <div className={`w-3 h-3 rounded-full ${config.color} mb-2`}></div>
              <p className="text-2xl font-bold text-gray-900">{getLeadsByStatus(status).length}</p>
              <p className="text-sm text-gray-600">{config.title}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            {Object.entries(FUNNEL_STAGES).map(([status, config]) => (
              <div key={status} className="bg-white rounded-lg shadow">
                <div className={`${config.color} text-white px-4 py-3 rounded-t-lg`}>
                  <h3 className="font-semibold text-sm">{config.title}</h3>
                  <p className="text-xs opacity-90">{getLeadsByStatus(status).length} leads</p>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-gray-50' : ''
                      }`}
                    >
                      {getLeadsByStatus(status).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white border rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 text-sm">{lead.full_name}</h4>
                                <span className="text-xs text-gray-500">{lead.age} anos</span>
                              </div>
                              
                              <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {lead.phone}
                                </div>
                                
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {lead.class_day} - {lead.class_time}
                                </div>
                                
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {lead.class_name}
                                </div>
                                
                                {lead.specific_date && (
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {lead.specific_date}
                                  </div>
                                )}
                                
                                {lead.created_at && (
                                  <div className="text-xs text-gray-400 mt-2">
                                    Criado: {formatDate(lead.created_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}