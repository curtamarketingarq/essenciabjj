import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Phone, Mail, Calendar, User, Clock, LogOut, RefreshCw, Eye, Plus, X, Edit2, Trash2, GripVertical, ChevronDown, ArrowRight } from 'lucide-react';
import { getTrialRegistrations, updateTrialRegistrationStatus } from '../lib/supabase';
import type { TrialRegistration } from '../lib/supabase';

interface CRMProps {
  onLogout: () => void;
}

interface Lead extends TrialRegistration {
  id: string;
  status: string;
}

interface FunnelStage {
  title: string;
  color: string;
  editable?: boolean;
  order: number;
}

const DEFAULT_FUNNEL_STAGES: Record<string, FunnelStage> = {
  pending: { title: 'Novos Leads', color: 'bg-blue-500', order: 0 },
  contacted: { title: 'Contatados', color: 'bg-yellow-500', order: 1 },
  confirmed: { title: 'Confirmados', color: 'bg-green-500', order: 2 },
  completed: { title: 'Compareceram', color: 'bg-purple-500', order: 3 },
  enrolled: { title: 'Matriculados', color: 'bg-emerald-500', order: 4 },
  no_show: { title: 'Não Compareceram', color: 'bg-red-500', order: 5 },
  cancelled: { title: 'Cancelados', color: 'bg-gray-500', order: 6 }
};

export default function CRM({ onLogout }: CRMProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [showNewLaneModal, setShowNewLaneModal] = useState(false);
  const [newLaneName, setNewLaneName] = useState('');
  const [newLaneColor, setNewLaneColor] = useState('bg-indigo-500');
  const [funnelStages, setFunnelStages] = useState<Record<string, FunnelStage>>(DEFAULT_FUNNEL_STAGES);
  const [isDraggingLane, setIsDraggingLane] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;
    
    // Handle lane reordering
    if (type === 'LANE') {
      const stageEntries = getSortedStages();
      const [removed] = stageEntries.splice(source.index, 1);
      stageEntries.splice(destination.index, 0, removed);
      
      const updatedStages = { ...funnelStages };
      stageEntries.forEach(([stageId], index) => {
        updatedStages[stageId] = { ...updatedStages[stageId], order: index };
      });
      
      setFunnelStages(updatedStages);
      setIsDraggingLane(false);
      return;
    }
    
    // Handle lead movement
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return; // No change
    }

    // Different lanes - move lead to new status
    const newStatus = destination.droppableId;
    
    try {
      // Update lead status in database
      await updateTrialRegistrationStatus(draggableId, newStatus);
      
      // Update local state
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

  const getSortedStages = () => {
    return Object.entries(funnelStages).sort(([, a], [, b]) => a.order - b.order);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  const handleCreateNewLane = () => {
    if (!newLaneName.trim()) return;
    
    const laneId = newLaneName.toLowerCase().replace(/\s+/g, '_');
    const maxOrder = Math.max(...Object.values(funnelStages).map(stage => stage.order));
    
    setFunnelStages(prev => ({
      ...prev,
      [laneId]: {
        title: newLaneName,
        color: newLaneColor,
        editable: true,
        order: maxOrder + 1
      }
    }));
    
    setNewLaneName('');
    setNewLaneColor('bg-indigo-500');
    setShowNewLaneModal(false);
  };

  const handleDeleteLane = (laneId: string) => {
    if (!funnelStages[laneId]?.editable) return;
    
    // Move leads from deleted lane to pending
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.status === laneId ? { ...lead, status: 'pending' } : lead
      )
    );
    
    // Remove lane
    setFunnelStages(prev => {
      const newStages = { ...prev };
      delete newStages[laneId];
      return newStages;
    });
  };

  const moveLane = (laneId: string, direction: 'left' | 'right') => {
    const sortedStages = getSortedStages();
    const currentIndex = sortedStages.findIndex(([id]) => id === laneId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= sortedStages.length) return;
    
    const updatedStages = { ...funnelStages };
    
    // Swap orders
    const currentOrder = updatedStages[laneId].order;
    const targetLaneId = sortedStages[newIndex][0];
    const targetOrder = updatedStages[targetLaneId].order;
    
    updatedStages[laneId] = { ...updatedStages[laneId], order: targetOrder };
    updatedStages[targetLaneId] = { ...updatedStages[targetLaneId], order: currentOrder };
    
    setFunnelStages(updatedStages);
  };

  const moveLeadToStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateTrialRegistrationStatus(leadId, newStatus);
      
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status do lead');
    }
  };

  const colorOptions = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500'
  ];

  // Component for lead status dropdown
  const LeadStatusDropdown = ({ lead }: { lead: Lead }) => {
    const isOpen = openDropdown === lead.id;
    const currentStage = funnelStages[lead.status];
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : lead.id);
          }}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <div className={`w-2 h-2 rounded-full ${currentStage?.color || 'bg-gray-500'}`}></div>
          <span className="text-gray-700 max-w-[80px] truncate">{currentStage?.title || lead.status}</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
            {getSortedStages()
              .filter(([statusId]) => statusId !== lead.status)
              .map(([statusId, config]) => (
                <button
                  key={statusId}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLeadToStatus(lead.id, statusId);
                    setOpenDropdown(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <span className="text-gray-700">{config.title}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400 ml-auto" />
                </button>
              ))}
          </div>
        )}
      </div>
    );
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
        <div className="px-4 sm:px-6 lg:px-8">
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
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {getSortedStages().map(([status, config]) => (
            <div key={status} className="bg-white rounded-lg shadow p-4 min-w-[140px] flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${config.color} mb-2`}></div>
              <p className="text-2xl font-bold text-gray-900">{getLeadsByStatus(status).length}</p>
              <p className="text-sm text-gray-600">{config.title}</p>
            </div>
          ))}
          <button
            onClick={() => setShowNewLaneModal(true)}
            className="bg-white rounded-lg shadow p-4 min-w-[140px] flex-shrink-0 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-gray-600"
          >
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Nova Lane</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          {getSortedStages().map(([status, config], index) => (
            <div key={status} className="bg-white rounded-lg shadow min-w-[320px] flex-shrink-0">
              <div className={`${config.color} text-white px-4 py-3 rounded-t-lg flex justify-between items-center`}>
                <div className="flex items-center">
                  <div className="flex flex-col mr-2">
                    <button
                      onClick={() => moveLane(status, 'left')}
                      className="text-white hover:bg-black hover:bg-opacity-10 p-0.5 rounded text-xs leading-none mb-0.5 disabled:opacity-50"
                      disabled={index === 0}
                      title="Mover para esquerda"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => moveLane(status, 'right')}
                      className="text-white hover:bg-black hover:bg-opacity-10 p-0.5 rounded text-xs leading-none disabled:opacity-50"
                      disabled={index === getSortedStages().length - 1}
                      title="Mover para direita"
                    >
                      →
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{config.title}</h3>
                    <p className="text-xs opacity-90">{getLeadsByStatus(status).length} leads</p>
                  </div>
                </div>
                {config.editable && (
                  <button
                    onClick={() => handleDeleteLane(status)}
                    className="text-white hover:text-red-200 transition-colors p-1 rounded hover:bg-black hover:bg-opacity-10"
                    title="Deletar lane"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {getLeadsByStatus(status).map((lead, index) => (
                  <div
                    key={lead.id}
                    className="bg-white border rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm pr-2">{lead.full_name}</h4>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">{lead.age} anos</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeadClick(lead);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{lead.class_day}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{lead.class_name}</span>
                      </div>
                      
                      {lead.specific_date && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{lead.specific_date}</span>
                        </div>
                      )}
                      
                      {lead.created_at && (
                        <div className="text-xs text-gray-400 mt-2">
                          {formatDate(lead.created_at)}
                        </div>
                      )}
                    </div>
                    
                    {/* Status Controls */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <LeadStatusDropdown lead={lead} />
                      <div className="flex space-x-1">
                        {getSortedStages()
                          .filter(([statusId]) => statusId !== lead.status)
                          .slice(0, 2)
                          .map(([statusId, config]) => (
                            <button
                              key={statusId}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLeadToStatus(lead.id, statusId);
                              }}
                              className={`px-2 py-1 text-xs rounded ${config.color} text-white hover:opacity-80 transition-opacity`}
                              title={`Mover para ${config.title}`}
                            >
                              →
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty state */}
                {getLeadsByStatus(status).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum lead nesta etapa</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes do Lead */}
      {showLeadDetails && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Detalhes do Lead</h2>
              <button
                onClick={() => setShowLeadDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <p className="text-gray-900 font-semibold">{selectedLead.full_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <p className="text-gray-900">{selectedLead.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
                <p className="text-gray-900">{selectedLead.age} anos</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Aula</label>
                <p className="text-gray-900">{selectedLead.class_day}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <p className="text-gray-900">{selectedLead.class_time}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                <p className="text-gray-900">{selectedLead.class_name}</p>
              </div>
              
              {selectedLead.specific_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Específica</label>
                  <p className="text-gray-900">{selectedLead.specific_date}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  funnelStages[selectedLead.status]?.color || 'bg-gray-500'
                } text-white`}>
                  {funnelStages[selectedLead.status]?.title || selectedLead.status}
                </span>
              </div>
              
              {selectedLead.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <p className="text-gray-900">{formatDate(selectedLead.created_at)}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowLeadDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Lane */}
      {showNewLaneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Criar Nova Lane</h2>
              <button
                onClick={() => setShowNewLaneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Lane</label>
                <input
                  type="text"
                  value={newLaneName}
                  onChange={(e) => setNewLaneName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: Em Negociação"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLaneColor(color)}
                      className={`w-8 h-8 rounded-full ${color} ${
                        newLaneColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowNewLaneModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewLane}
                disabled={!newLaneName.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Lane
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}