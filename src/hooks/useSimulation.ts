import { useState, useEffect, useCallback } from 'react';
import { recentEvents } from '../data/mockData';

const SIMULATED_EVENTS = [
  { type: 'ACCESS', text: 'Employee EMP-0102 accessed ACC-33210 (routine)', severity: 'low' as const },
  { type: 'TXN', text: 'UPI ₹2,400 from CUST-1122 to BEN-5501', severity: 'low' as const },
  { type: 'VPN', text: 'VPN login EMP-0044 from Delhi (usual)', severity: 'low' as const },
  { type: 'AUTH', text: 'Password change CUST-2201 via mobile app', severity: 'low' as const },
  { type: 'TXN', text: 'NEFT ₹15,000 from ACC-22100 approved', severity: 'low' as const },
  { type: 'EDR', text: 'Device DEV-0881 OS update detected', severity: 'low' as const },
  { type: 'ACCESS', text: 'EMP-0190 viewed loan records (authorized)', severity: 'low' as const },
  { type: 'TXN', text: 'ATM withdrawal ₹10,000 CUST-3305', severity: 'low' as const },
  { type: 'IAM', text: 'Scheduled privilege review completed', severity: 'low' as const },
  { type: 'SCORING', text: 'Risk scores updated for 312 entities', severity: 'medium' as const },
];

export function useSimulation() {
  const [events, setEvents] = useState(recentEvents);
  const [eventCount, setEventCount] = useState(48230);
  const [isLive, setIsLive] = useState(true);

  const addEvent = useCallback(() => {
    const template = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const newEvent = { ...template, time };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
    setEventCount(prev => prev + Math.floor(Math.random() * 5) + 1);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(addEvent, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [isLive, addEvent]);

  return { events, eventCount, isLive, setIsLive };
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}
