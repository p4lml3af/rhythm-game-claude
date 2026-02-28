import React from 'react';

interface ResultsScreenProps {
  accuracy: number;
  maxCombo: number;
  perfectHits: number;
  totalNotes: number;
  levelId: string;
  previousBest: number | null;
  isNewBest: boolean;
  onReplay: () => void;
  onBack: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  accuracy,
  maxCombo,
  perfectHits,
  totalNotes,
  previousBest,
  isNewBest,
  onReplay,
  onBack,
}) => {
  return (
    <div
      data-testid="screen-results"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#CCCCCC',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '40px', color: '#FFFFFF' }}>
        Level Complete
      </h1>

      <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
        {accuracy.toFixed(1)}%
      </div>

      {isNewBest ? (
        <div data-testid="label-new-best" style={{ fontSize: '24px', color: '#00FF00', marginBottom: '32px' }}>
          New best!
        </div>
      ) : (
        <div data-testid="label-previous-best" style={{ fontSize: '24px', color: '#888888', marginBottom: '32px' }}>
          Previous best: {previousBest?.toFixed(1)}%
        </div>
      )}

      <div style={{ display: 'flex', gap: '60px', marginBottom: '48px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFFFFF' }}>{maxCombo}x</div>
          <div style={{ fontSize: '16px' }}>Max Combo</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFFFFF' }}>{perfectHits}</div>
          <div style={{ fontSize: '16px' }}>Perfect Hits</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFFFFF' }}>{totalNotes}</div>
          <div style={{ fontSize: '16px' }}>Total Notes</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          data-testid="button-replay"
          onClick={onReplay}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            backgroundColor: '#333333',
            color: '#FFFFFF',
            border: '1px solid #555555',
            cursor: 'pointer',
          }}
        >
          Replay
        </button>
        <button
          data-testid="button-back"
          onClick={onBack}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            backgroundColor: '#333333',
            color: '#FFFFFF',
            border: '1px solid #555555',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};
