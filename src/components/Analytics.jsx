import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';
import './Analytics.css';

export default function Analytics({ session }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, completed: 0, rate: 0 });

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalyticsData();
    }
  }, [session]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch boards
      const { data: boards } = await supabase
        .from('boards')
        .select('id, title')
        .eq('user_id', session.user.id);
        
      if (!boards || boards.length === 0) {
        setLoading(false);
        return;
      }

      const boardIds = boards.map(b => b.id);

      // Fetch lists
      const { data: lists } = await supabase
        .from('lists')
        .select('id, title, board_id')
        .in('board_id', boardIds);
        
      const listIds = lists ? lists.map(l => l.id) : [];

      // Fetch cards
      const { data: cards } = await supabase
        .from('cards')
        .select('id, list_id')
        .in('list_id', listIds);

      // Process data
      let globalTotal = 0;
      let globalCompleted = 0;
      
      const chartData = boards.map(board => {
        const boardLists = lists.filter(l => l.board_id === board.id);
        const boardListIds = boardLists.map(l => l.id);
        const boardCards = cards.filter(c => boardListIds.includes(c.list_id));
        
        const completedLists = boardLists.filter(l => l.title.toLowerCase().includes('concluído') || l.title.toLowerCase().includes('done')).map(l => l.id);
        const completedCards = boardCards.filter(c => completedLists.includes(c.list_id));
        
        globalTotal += boardCards.length;
        globalCompleted += completedCards.length;

        const rate = boardCards.length > 0 ? Math.round((completedCards.length / boardCards.length) * 100) : 0;

        return {
          name: board.title,
          Total: boardCards.length,
          Concluído: completedCards.length,
          rate: rate,
          Pendentes: boardCards.length - completedCards.length
        };
      });

      setSummary({
        total: globalTotal,
        completed: globalCompleted,
        rate: globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0
      });

      setData(chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="analytics-loading">Carregando métricas...</div>;

  const pieData = [
    { name: 'Concluído', value: summary.completed },
    { name: 'Pendentes', value: summary.total - summary.completed }
  ];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <BarChart2 size={28} />
        <h2>Estatísticas e Produtividade</h2>
      </div>

      <div className="analytics-summary-cards">
        <div className="summary-card">
          <h3>Total de Tarefas</h3>
          <p className="summary-value">{summary.total}</p>
        </div>
        <div className="summary-card">
          <h3>Tarefas Concluídas</h3>
          <p className="summary-value text-success">{summary.completed}</p>
        </div>
        <div className="summary-card">
          <h3>Taxa de Conclusão Global</h3>
          <p className="summary-value">{summary.rate}%</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Crie alguns quadros e tarefas para ver as estatísticas!
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-wrapper">
            <h3 className="chart-title">Desempenho por Setor</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Bar dataKey="Concluído" stackId="a" fill="#00C49F" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Pendentes" stackId="a" fill="#3C64F4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h3 className="chart-title">Visão Global</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#3C64F4" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
