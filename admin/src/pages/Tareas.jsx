import React, { useEffect, useState } from 'react';
import { KanbanComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-kanban';
import { Header } from '../components';
import { crmService } from '../services/crmService';

const Tareas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tareasData, setTareasData] = useState([]);

  useEffect(() => {
    const fetchTareas = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await crmService.tareas.getAll();
        const mapped = (data || []).map((t) => ({
          Id: t._id,
          Title: t.title || 'Sin título',
          Status: t.status || 'Open',
          Summary: t.summary || '',
          Priority: t.priority || 'Media',
          Tags: Array.isArray(t.tags) ? t.tags.join(',') : (t.tags || ''),
        }));
        setTareasData(mapped);
      } catch (e) {
        setError('No se pudieron cargar las tareas');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTareas();
  }, []);

  const cardTemplate = (props) => {
    return (
      <div className="e-card-content">
        <div className="e-card-header">
          <div className="e-card-header-title font-bold">{props.Title}</div>
        </div>
        <div className="e-card-content-description text-sm mt-2">
          {props.Summary}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`px-2 py-1 text-xs rounded-full ${
            props.Priority === 'Alta' ? 'bg-red-100 text-red-800' :
            props.Priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {props.Priority}
          </span>
          <span className="text-xs text-gray-500">{props.Tags}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
      <Header category="Productividad" title="Gestión de Tareas" />
      
      <div className="mb-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Nueva Tarea
        </button>
      </div>
      {loading && (
        <div className="mb-4 text-sm text-gray-500">Cargando tareas...</div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <KanbanComponent
        id="kanban"
        keyField="Status"
        dataSource={tareasData}
        cardSettings={{ contentField: 'Summary', headerField: 'Id' }}
        cardTemplate={cardTemplate}
        onActionBegin={(args) => {
          if (args.requestType === 'cardChanged') {
            // Cuando se mueve una tarjeta, actualiza el status en el backend
            const { movedCards } = args;
            movedCards.forEach(async (card) => {
              try {
                await crmService.tareas.update(card.Id, { status: card.Status });
              } catch (error) {
                console.error('Error updating task status:', error);
              }
            });
          }
        }}
      >
        <ColumnsDirective>
          <ColumnDirective headerText="Por Hacer" keyField="Open" allowToggle={true} />
          <ColumnDirective headerText="En Progreso" keyField="InProgress" allowToggle={true} />
          <ColumnDirective headerText="Revisión" keyField="Testing" allowToggle={true} />
          <ColumnDirective headerText="Completadas" keyField="Close" allowToggle={true} />
        </ColumnsDirective>
      </KanbanComponent>
    </div>
  );
};

export default Tareas;
