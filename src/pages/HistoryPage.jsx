import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TeamDetailPage from '../components/TeamDetailPage';

export default function HistoryPage({ history, user, onDeleteCompetition }) {
  const { compId, teamNumber } = useParams();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // If teamNumber is in URL, show that team's detail
  const selectedComp = compId ? history.find((c) => c.id === parseInt(compId)) : null;
  const selectedTeam = selectedComp && teamNumber 
    ? { number: teamNumber, name: selectedComp.entries?.find(e => e.teamNumber === teamNumber)?.teamName || '' }
    : null;

  const isAdmin = user?.isAdmin === true;

  const handleDeleteClick = (compId) => {
    setConfirmDelete(compId);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete && onDeleteCompetition) {
      onDeleteCompetition(confirmDelete);
      setConfirmDelete(null);
    }
  };

  if (selectedTeam && selectedComp) {
    const teamEntries = selectedComp.entries?.filter((e) => e.teamNumber === teamNumber) || [];
    return (
      <TeamDetailPage
        team={selectedTeam}
        entries={teamEntries}
        onBack={() => navigate('/history')}
      />
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>History</h1>
        <p>Archived competition scouting data</p>
      </div>

      {history.length === 0 && (
        <div className="empty-state">
          No archived competitions yet. Use the Configuration page to archive an active competition.
        </div>
      )}

      {[...history].reverse().map((comp) => {
        const teamNums  = comp.entries ? [...new Set(comp.entries.map((e) => e.teamNumber))] : [];
        const isOpen    = expanded === comp.id;

        return (
          <div key={comp.id} className="history-comp">
            <div
              className="history-comp-header"
              onClick={() => setExpanded(isOpen ? null : comp.id)}
            >
              <div style={{ flex: 1 }}>
                <div className="history-comp-name">{comp.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Archived {new Date(comp.archivedAt).toLocaleDateString()} &nbsp;·&nbsp;
                  {comp.entries?.length || 0} entr{comp.entries?.length !== 1 ? 'ies' : 'y'} &nbsp;·&nbsp;
                  {teamNums.length} team{teamNums.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isAdmin && (
                  <button 
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(comp.id); }}
                    title="Delete Competition"
                    style={{ padding: '6px 10px', fontSize: 14 }}
                  >
                    🗑️
                  </button>
                )}
                <span style={{ color: 'var(--muted)' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div className="history-entries">
                {teamNums.map((num) => {
                  const te   = comp.entries ? comp.entries.filter((e) => e.teamNumber === num) : [];
                  const name = te[0]?.teamName || '';
                  return (
                    <Link
                      key={num}
                      to={`/history/${comp.id}/${num}`}
                      className="history-team-row"
                    >
                      <span className="team-list-num">{num}</span>
                      <span>{name}</span>
                      <span className="muted">{te.length} entr{te.length !== 1 ? 'ies' : 'y'}</span>
                      <span className="arrow-small">→</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h2>Delete Competition</h2>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ marginBottom: 20 }}>
                Are you sure you want to delete this competition from history? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button 
                  className="cancel-btn" 
                  onClick={() => setConfirmDelete(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-btn" 
                  onClick={handleConfirmDelete}
                  style={{ flex: 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
