
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Role, AppState, User, CheckIn, SimSale, DailyReport } from '../types';
import { 
  Users, TrendingUp, Search, MapPin, Activity, 
  Phone, X, Clock, 
  ChevronRight, Smartphone, ExternalLink,
  CheckCircle, FileText, UserPlus, Award, BarChart2,
  ArrowLeft, CalendarDays,
  Image as ImageIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Navigation2,
  AlertTriangle,
  Trophy,
  ChevronLeft,
  PackageSearch,
  RotateCcw,
  Calendar,
  Maximize2,
  Quote,
  LayoutGrid
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import L from 'leaflet';
import { getTodayStr } from '../App';

interface ManagerPanelProps {
  state: AppState;
  approveUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
}

const isDateMatch = (timestamp: string, dateStr: string) => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` === dateStr;
};

const getFormattedDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getLatenessStatus = (checkInTimestamp: string, workingHours?: string) => {
  if (!workingHours || !workingHours.includes('-')) return null;
  
  try {
    const startTimePart = workingHours.split('-')[0].trim();
    const timeMatch = startTimePart.match(/(\d{1,2})[:.](\d{2})/);
    
    if (!timeMatch) return null;
    
    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);
    
    const checkInDate = new Date(checkInTimestamp);
    if (isNaN(checkInDate.getTime())) return null;

    const startTotalMinutes = startH * 60 + startM;
    const checkInTotalMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();

    if (checkInTotalMinutes > startTotalMinutes) {
      const diff = checkInTotalMinutes - startTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      
      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;
      
      return {
        isLate: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

const SingleLocationMap: React.FC<{ location: { lat: number; lng: number } | null, initials: string }> = ({ location, initials }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current && location) {
      leafletMap.current = L.map(mapRef.current, { 
        scrollWheelZoom: true, 
        dragging: true, 
        zoomControl: false,
        attributionControl: false
      }).setView([location.lat, location.lng], 16);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
        maxZoom: 20 
      }).addTo(leafletMap.current);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      
      const customIcon = L.divIcon({
        className: 'custom-staff-icon-pin',
        html: `<div class="map-marker-pin-tear"><div class="pin-initials">${initials}</div></div>`,
        iconSize: [40, 48], iconAnchor: [20, 48]
      });

      markerRef.current = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(leafletMap.current);
      
      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 100);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
    };
  }, [location === null]);

  useEffect(() => {
    if (leafletMap.current && location) {
      leafletMap.current.setView([location.lat, location.lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        const customIcon = L.divIcon({
          className: 'custom-staff-icon-pin',
          html: `<div class="map-marker-pin-tear"><div class="pin-initials">${initials}</div></div>`,
          iconSize: [40, 48], iconAnchor: [20, 48]
        });
        markerRef.current = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(leafletMap.current);
      }
      leafletMap.current.invalidateSize();
    }
  }, [location, initials]);

  if (!location) return (
    <div className="h-56 flex flex-col items-center justify-center text-gray-300 italic font-black text-xs uppercase tracking-widest bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 p-8 text-center">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <MapPin className="w-8 h-8 opacity-20" />
      </div>
      Joylashuv ma'lumotlari topilmadi
    </div>
  );

  return (
    <div className="h-56 rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner relative group">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <a 
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white text-blue-600 hover:text-blue-700 transition-all block hover:scale-105"
          title="Google Maps'da ko'rish"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="absolute bottom-4 left-6 z-10 bg-blue-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl ring-4 ring-white/30">
        JONLI MANZIL
      </div>
    </div>
  );
};

const PhotoViewer: React.FC<{ photo: string; onClose: () => void }> = ({ photo, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
    <div className="relative z-10 max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in-95">
      <button 
        onClick={onClose} 
        className="absolute -top-14 right-0 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/20 z-50"
      >
        <X className="w-6 h-6" />
      </button>
      <img 
        src={photo} 
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" 
        alt="Full view" 
      />
      <div className="mt-4 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full border border-white/10">
        Yopish uchun ekranga bosing
      </div>
    </div>
  </div>
);

const StaffMap: React.FC<{ checkIns: CheckIn[], reports: DailyReport[], users: User[], today: string }> = ({ checkIns, reports, users, today }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);

  const operators = useMemo(() => users.filter(u => u.isApproved && u.role !== Role.MANAGER), [users]);

  const staffStatus = useMemo(() => {
    return operators.map(user => {
      const userCheckIns = checkIns
        .filter(ci => ci.userId === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const lastKnownLocation = userCheckIns[0];
      const todayCheckIn = userCheckIns.find(ci => isDateMatch(ci.timestamp, today));
      const todayReport = reports.find(r => r.userId === user.id && r.date === today);
      
      return { user, todayCheckIn, todayReport, lastKnownLocation, isPresent: !!todayCheckIn, hasFinished: !!todayReport };
    });
  }, [operators, checkIns, reports, today]);

  const fitToMarkers = () => {
    if (leafletMap.current && markersGroup.current) {
      const layers = markersGroup.current.getLayers();
      if (layers.length > 0) {
        const boundsArr = layers.map((l: any) => l.getLatLng());
        leafletMap.current.fitBounds(L.latLngBounds(boundsArr as any), { padding: [80, 80], maxZoom: 14 });
      }
    }
  };

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { scrollWheelZoom: true, dragging: true, zoomControl: false }).setView([41.311081, 69.240562], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 20 }).addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      markersGroup.current = L.layerGroup().addTo(leafletMap.current);
      
      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 250);

      const resizeObserver = new ResizeObserver(() => {
        leafletMap.current?.invalidateSize();
      });
      resizeObserver.observe(mapRef.current);
      return () => {
        resizeObserver.disconnect();
        if (leafletMap.current) {
          leafletMap.current.remove();
          leafletMap.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (leafletMap.current && markersGroup.current) {
      markersGroup.current.clearLayers();
      staffStatus.forEach(({ user, lastKnownLocation, todayCheckIn, isPresent, hasFinished }) => {
        if (!lastKnownLocation?.location) return;
        let statusColor = isPresent ? (hasFinished ? '#64748b' : '#2563eb') : '#ef4444';
        let statusLabel = isPresent ? (hasFinished ? 'Tugatgan' : 'Ishda') : 'Kelmagan';
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
        
        const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, user.workingHours) : null;

        const customIcon = L.divIcon({
          className: 'custom-staff-icon-marker',
          html: `
            <div class="map-marker-v2-container ${isPresent && !hasFinished ? 'marker-pulse-v2' : ''} ${lateness ? 'marker-late-v2' : ''}" style="opacity: ${isPresent ? '1' : '0.8'}">
              <div class="map-marker-v2-pin" style="background-color: ${statusColor}; ${lateness ? 'border-color: #ef4444; border-width: 3px;' : ''}">
                <span class="map-marker-v2-initials">${initials}</span>
              </div>
              <div class="map-marker-v2-arrow" style="border-top-color: ${lateness ? '#ef4444' : statusColor}"></div>
              ${lateness ? '<div class="late-badge-v2">!</div>' : ''}
            </div>
          `,
          iconSize: [36, 46], 
          iconAnchor: [18, 46], 
          popupAnchor: [0, -40]
        });
        
        const latenessHtml = lateness ? 
          `<div style="color: white; font-weight: 900; background: #ef4444; padding: 4px 10px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); font-size: 10px; display: flex; align-items: center; gap: 6px; text-transform: uppercase;">
            <span style="font-size: 14px;">🚨</span> LATE: ${lateness.durationStr}
          </div>` : '';

        L.marker([lastKnownLocation.location.lat, lastKnownLocation.location.lng], { icon: customIcon })
          .bindTooltip(`<div class="map-tooltip-content" style="padding: 10px; min-width: 140px;">
            <span class="tooltip-name" style="font-weight: 900; color: #1e293b; font-size: 15px; display: block; margin-bottom: 6px; letter-spacing: -0.02em;">${user.firstName} ${user.lastName}</span>
            <div class="tooltip-status" style="display: flex; align-items: center; gap: 8px;">
              <span class="status-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; box-shadow: 0 0 0 3px ${statusColor}33"></span>
              <span class="status-text" style="color: ${statusColor}; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">${statusLabel}</span>
            </div>
            ${latenessHtml}
          </div>`, { direction: 'top', offset: [0, -40], className: 'map-custom-tooltip' })
          .addTo(markersGroup.current!);
      });
      fitToMarkers();
    }
  }, [staffStatus]);

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl bg-white flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-gray-50/90 backdrop-blur-md border-r border-gray-100 overflow-y-auto custom-scrollbar p-4 z-20">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Xodimlar ({staffStatus.length})</h4>
        <div className="space-y-2">
          {staffStatus.map(({ user, todayCheckIn, isPresent, hasFinished }) => {
            const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, user.workingHours) : null;
            return (
              <div key={user.id} className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${lateness ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isPresent ? (lateness ? 'bg-red-600 text-white' : 'bg-blue-100 text-blue-600') : 'bg-red-50 text-red-400'}`}>{user.firstName?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate leading-none mb-1">{user.firstName} {user.lastName}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{isPresent ? (hasFinished ? 'Tugatgan' : 'Ishda') : 'Kelmagan'}</p>
                    {lateness && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-md font-black animate-pulse shadow-sm shadow-red-200">LATE</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full min-h-[400px] z-10" />
        <button onClick={fitToMarkers} className="absolute top-4 right-4 z-[20] p-3 bg-white/95 rounded-xl shadow-lg border border-white text-blue-600 active:scale-95 transition-all"><Navigation2 className="w-4 h-4 fill-current" /></button>
      </div>
    </div>
  );
};

const ManagerPanel: React.FC<ManagerPanelProps> = ({ state, approveUser, updateUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'approvals'>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartTimeframe, setChartTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const today = getTodayStr();
  const approvedUsers = useMemo(() => state.users.filter(u => u.isApproved), [state.users]);
  const operators = useMemo(() => approvedUsers.filter(u => u.role !== Role.MANAGER), [approvedUsers]);
  const pendingUsers = useMemo(() => state.users.filter(u => !u.isApproved), [state.users]);
  const selectedUser = useMemo(() => state.users.find(u => u.id === selectedUserId) || null, [state.users, selectedUserId]);

  const getUserSalesCount = (userId: string, timeframe: string) => {
    let sales = state.sales.filter(s => s.userId === userId);
    if (timeframe === 'today') sales = sales.filter(s => s.date === today);
    if (timeframe === 'month') sales = sales.filter(s => s.date.startsWith(today.substring(0, 7)));
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      sales = sales.filter(s => new Date(s.date) >= weekAgo);
    }
    return sales.reduce((sum, s) => sum + s.count + s.bonus, 0);
  };

  const getSalesChartData = (userId: string, timeframe: 'week' | 'month' | 'year', targetYear: number, wOffset: number, mOffset: number) => {
    const data = [];
    
    if (timeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay(); 
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (wOffset * 7));
      
      for (let i = 0; i < 7; i++) {
        const current = new Date(targetMonday);
        current.setDate(targetMonday.getDate() + i);
        const dateStr = getFormattedDateStr(current);
        const count = state.sales.filter(s => s.userId === userId && s.date === dateStr).reduce((sum, s) => sum + s.count + s.bonus, 0);
        data.push({ 
          name: current.toLocaleDateString('en-US', { weekday: 'short' }), 
          fullDate: dateStr, 
          sales: count 
        });
      }
    } else if (timeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + mOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const current = new Date(year, month, i);
        const dateStr = getFormattedDateStr(current);
        const count = state.sales.filter(s => s.userId === userId && s.date === dateStr).reduce((sum, s) => sum + s.count, 0);
        data.push({ name: i.toString(), fullDate: dateStr, sales: count });
      }
    } else if (timeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${targetYear}-${String(monthNum).padStart(2, '0')}`;
        const count = state.sales.filter(s => s.userId === userId && s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + s.count, 0);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        data.push({ name: monthNames[m], fullDate: `${targetYear}-${String(monthNum).padStart(2, '0')}-01`, sales: count });
      }
    }
    return data;
  };

  const currentChartData = useMemo(() => {
    if (!selectedUserId) return [];
    return getSalesChartData(selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset);
  }, [selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset, state.sales]);

  const chartTitleLabel = useMemo(() => {
    if (chartTimeframe === 'week') return 'Haftalik';
    if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      return d.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
    }
    if (chartTimeframe === 'year') return `Yillik - ${selectedYear}`;
    return '';
  }, [chartTimeframe, monthOffset, selectedYear]);

  const activeReferencePoint = useMemo(() => {
    if (!selectedDay) return null;
    return currentChartData.find(d => d.fullDate === selectedDay);
  }, [selectedDay, currentChartData]);

  const filteredUsers = useMemo(() => {
    return approvedUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [approvedUsers, searchTerm]);

  const handleResetChart = () => {
    setSelectedDay(null);
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedYear(new Date().getFullYear());
  };

  useEffect(() => {
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedYear(new Date().getFullYear());
  }, [chartTimeframe, selectedUserId]);

  return (
    <div className="space-y-6">
      {viewingPhoto && <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />}
      
      <div className="flex p-1 bg-gray-200 rounded-2xl w-fit overflow-hidden">
        <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}><Activity className="w-4 h-4" /> Boshqaruv</button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}><Users className="w-4 h-4" /> Xodimlar</button>
        <button onClick={() => setActiveTab('reports')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}><FileText className="w-4 h-4" /> Hisobotlar</button>
        <button onClick={() => setActiveTab('approvals')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/50 relative'}`}><UserPlus className="w-4 h-4" /> Tasdiqlash {pendingUsers.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-black animate-pulse">{pendingUsers.length}</span>}</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Bugungi sotuv" value={state.sales.filter(s => s.date === today).reduce((sum, s) => sum + s.count + s.bonus, 0)} icon={<TrendingUp />} color="bg-blue-600" />
            <StatCard label="Xodimlar" value={approvedUsers.length} icon={<Users />} color="bg-indigo-600" />
            <StatCard label="Kutilmoqda" value={pendingUsers.length} icon={<UserPlus />} color="bg-orange-600" />
            <StatCard label="Jami" value={state.sales.reduce((sum, s) => sum + s.count + s.bonus, 0)} icon={<Award />} color="bg-green-600" />
          </div>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Trophy className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Xodimlar Samaradorligi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Xodim</th>
                    <th className="px-8 py-4">Lavozim</th>
                    <th className="px-8 py-4 text-center">Bugungi Sotuv</th>
                    <th className="px-8 py-4 text-center">Haftalik Sotuv</th>
                    <th className="px-8 py-4 text-right">Mavqei</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {operators.map(op => {
                    const todayCount = getUserSalesCount(op.id, 'today');
                    const weekCount = getUserSalesCount(op.id, 'week');
                    const todayCheckIn = state.checkIns.find(ci => ci.userId === op.id && isDateMatch(ci.timestamp, today));
                    const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, op.workingHours) : null;
                    
                    return (
                      <tr 
                        key={op.id} 
                        className={`transition group cursor-pointer ${lateness ? 'bg-red-50/50 hover:bg-red-100/50' : 'hover:bg-blue-50/30'}`}
                        onClick={() => {
                          setSelectedUserId(op.id);
                          setSelectedDay(null); // Defaults to today
                          setChartTimeframe('week');
                        }}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${lateness ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-gradient-to-br from-indigo-50 to-blue-50 text-blue-600 border-blue-100/50'}`}>
                              {op.firstName?.[0]}{op.lastName?.[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">{op.firstName} {op.lastName}</span>
                              {lateness && <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Kechikkan: {lateness.durationStr}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-100 px-2 py-1 rounded-md">
                            {op.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex flex-col">
                            <span className="text-xl font-black text-blue-600">{todayCount}</span>
                            <span className="text-[8px] font-black text-gray-300 uppercase">dona</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex flex-col">
                            <span className="text-xl font-black text-indigo-600">{weekCount}</span>
                            <span className="text-[8px] font-black text-gray-300 uppercase">dona</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <div key={star} className={`w-1.5 h-1.5 rounded-full ${weekCount > (star * 5) ? 'bg-orange-400' : 'bg-gray-200'}`}></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-[650px] flex flex-col">
            <div className="p-2 mb-2 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Jonli Monitoring</h3>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{today}</span>
            </div>
            <div className="flex-1 overflow-hidden"><StaffMap checkIns={state.checkIns} reports={state.reports} users={state.users} today={today} /></div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-gray-800">Xodimlar Jamoasi</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Xodimni qidirish..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-2 focus:ring-blue-500 transition outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredUsers.map(u => {
              const todayCheckIn = state.checkIns.find(ci => ci.userId === u.id && isDateMatch(ci.timestamp, today));
              const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, u.workingHours) : null;
              
              return (
                <div key={u.id} onClick={() => { setSelectedUserId(u.id); setChartTimeframe('week'); setSelectedDay(null); }} className={`p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group text-center relative overflow-hidden ${lateness ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                  {lateness && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">LATE</div>
                  )}
                  <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 font-black text-2xl group-hover:scale-110 transition-transform ${lateness ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'}`}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                  <h3 className="text-lg font-black text-gray-800">{u.firstName} {u.lastName}</h3>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{u.role.replace('_', ' ')}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-around">
                    <div className="text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Bugun</p><p className={`font-black ${lateness ? 'text-red-600' : 'text-blue-600'}`}>{getUserSalesCount(u.id, 'today')}</p></div>
                    <div className="text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Oy</p><p className="font-black text-gray-800">{getUserSalesCount(u.id, 'month')}</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl" onClick={() => { setSelectedUserId(null); setSelectedDay(null); }}></div>
              <div className="bg-gray-50 w-full h-full md:h-[92vh] md:w-[92vw] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-12">
                <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-50">
                  <div className="flex items-center gap-6">
                    <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition shadow-sm border border-gray-100"><ArrowLeft className="w-6 h-6" /></button>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl uppercase shadow-xl ring-4 ring-blue-50">
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-none mb-2">{selectedUser.firstName} {selectedUser.lastName}</h2>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">{selectedUser.role.replace('_', ' ')}</span>
                          <span className="text-gray-400 text-[10px] font-bold">● {selectedUser.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"><X className="w-6 h-6" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-gray-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <RefinedStatCard 
                      label="Bugungi Sotuv" 
                      value={getUserSalesCount(selectedUser.id, 'today')} 
                      icon={<Clock />} 
                      color="bg-blue-600" 
                      isActive={chartTimeframe === 'week'}
                      onClick={() => setChartTimeframe('week')}
                    />
                    <RefinedStatCard 
                      label="Shu Oylik" 
                      value={getUserSalesCount(selectedUser.id, 'month')} 
                      icon={<CalendarDays />} 
                      color="bg-indigo-600" 
                      isActive={chartTimeframe === 'month'}
                      onClick={() => setChartTimeframe('month')}
                    />
                    <RefinedStatCard 
                      label="Telefon" 
                      value={selectedUser.phone} 
                      icon={<Phone />} 
                      color="bg-violet-600" 
                    />
                    <RefinedStatCard 
                      label="Jami" 
                      value={getUserSalesCount(selectedUser.id, 'total')} 
                      icon={<Award />} 
                      color="bg-emerald-600" 
                      isActive={chartTimeframe === 'year'}
                      onClick={() => setChartTimeframe('year')}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-[2rem] p-6 shadow-sm overflow-hidden border-none outline-none select-none no-outline-container">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                              <BarChart2 className="w-5 h-5 text-blue-600" /> 
                              Sotuvlar Dinamikasi ({chartTitleLabel})
                            </h3>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
                              <button 
                                onClick={() => {
                                  if (chartTimeframe === 'week') setWeekOffset(prev => prev - 1);
                                  else if (chartTimeframe === 'month') setMonthOffset(prev => prev - 1);
                                  else if (chartTimeframe === 'year') setSelectedYear(prev => prev - 1);
                                }}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600 focus:outline-none"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-black text-blue-600 px-2 uppercase tracking-tighter whitespace-nowrap min-w-[120px] text-center">
                                {chartTimeframe === 'week' ? (
                                  currentChartData.length === 7 ? `${new Date(currentChartData[0].fullDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} — ${new Date(currentChartData[6].fullDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}` : '...'
                                ) : chartTimeframe === 'month' ? (
                                  chartTitleLabel
                                ) : (
                                  selectedYear
                                )}
                              </span>
                              <button 
                                onClick={() => {
                                  if (chartTimeframe === 'week') setWeekOffset(prev => prev + 1);
                                  else if (chartTimeframe === 'month') setMonthOffset(prev => prev + 1);
                                  else if (chartTimeframe === 'year') setSelectedYear(prev => prev + 1);
                                }}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600 focus:outline-none"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {(selectedDay || weekOffset !== 0 || monthOffset !== 0 || (chartTimeframe === 'year' && selectedYear !== new Date().getFullYear())) && (
                              <button 
                                onClick={handleResetChart}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition shadow-sm focus:outline-none"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Bugunga qaytish
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-64 border-none outline-none bg-white focus:outline-none focus:ring-0 chart-wrapper">
                          <ResponsiveContainer width="100%" height="100%" style={{ border: 'none', outline: 'none' }}>
                            <AreaChart 
                              data={currentChartData} 
                              onClick={(e: any) => {
                                if (e && e.activePayload && e.activePayload.length > 0) {
                                  const payload = e.activePayload[0].payload;
                                  if (payload && payload.fullDate) {
                                    setSelectedDay(payload.fullDate);
                                  }
                                } else if (e && e.activeTooltipIndex !== undefined) {
                                  const payload = currentChartData[e.activeTooltipIndex];
                                  if (payload && payload.fullDate) {
                                    setSelectedDay(payload.fullDate);
                                  }
                                }
                              }}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              style={{ border: 'none', outline: 'none' }}
                            >
                              <defs><linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 700}} 
                                interval={0}
                              />
                              <YAxis hide axisLine={false} tickLine={false} />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', outline: 'none'}} 
                                cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '4 4' }} 
                              />
                              {activeReferencePoint && (
                                <ReferenceLine x={activeReferencePoint.name} stroke="#2563eb" strokeWidth={2} strokeDasharray="3 3" />
                              )}
                              <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#2563eb" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#cl)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} 
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Smartphone className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-gray-800 tracking-tight">
                              {selectedDay || today} Kunlik Sotuvlar
                            </h3>
                          </div>
                          {selectedDay && (
                            <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                              <Calendar className="w-3 h-3" /> Tanlangan kun
                            </div>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                <th className="px-8 py-4">Kompaniya</th>
                                <th className="px-8 py-4">Tarif</th>
                                <th className="px-8 py-4 text-center">Soni</th>
                                <th className="px-8 py-4 text-center">Bonus</th>
                                <th className="px-8 py-4 text-center">Jami</th>
                                <th className="px-8 py-4 text-right">Vaqt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {(() => {
                                const targetDate = selectedDay || today;
                                const daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === targetDate);
                                if (daySales.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                            <PackageSearch className="w-10 h-10" />
                                          </div>
                                          <p className="text-sm font-black text-gray-400 italic">Bu kunda hech nima sotilmagan</p>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                                return daySales.map(sale => (
                                  <tr key={sale.id} className="hover:bg-indigo-50/20 transition group">
                                    <td className="px-8 py-5">
                                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">{sale.company}</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-gray-700">{sale.tariff}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-indigo-600">{sale.count}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-gray-700">{sale.bonus.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-indigo-600">{(sale.count + sale.bonus).toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right text-[10px] font-bold text-gray-300">{new Date(sale.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* OPTIMIZED DAILY REPORT DISPLAY MATCHING SCREENSHOT */}
                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><FileText className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-gray-800 tracking-tight">
                              Kunlik Hisobot {selectedDay ? `(${selectedDay})` : '(Bugun)'}
                            </h3>
                          </div>
                        </div>
                        <div className="p-8">
                          {(() => {
                            const targetDate = selectedDay || today;
                            const dailyReport = state.reports.find(r => r.userId === selectedUser.id && r.date === targetDate);
                            
                            if (!dailyReport) {
                              return (
                                <div className="flex flex-col items-center py-10 text-center gap-4">
                                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <AlertTriangle className="w-8 h-8" />
                                  </div>
                                  <p className="text-sm font-black text-gray-400 italic">Bu kun uchun hisobot yuborilmagan</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-10">
                                {dailyReport.photos && dailyReport.photos.length > 0 && (
                                  <div className="space-y-5">
                                    <div className="flex items-center gap-3 px-2">
                                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                      </div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">ILOVA QILINGAN RASMLAR ({dailyReport.photos.length})</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                      {dailyReport.photos.map((photo, idx) => (
                                        <div 
                                          key={idx}
                                          className="relative group cursor-pointer overflow-hidden rounded-[2.2rem] border-4 border-white shadow-xl aspect-square transition-all hover:scale-[1.02]"
                                          onClick={() => setViewingPhoto(photo)}
                                        >
                                          <img src={photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-75 group-hover:scale-100 transition-all">
                                              <Maximize2 className="w-6 h-6" />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col gap-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kunlik Xulosa</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                      {new Date(dailyReport.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}
                                    </span>
                                  </div>
                                  <p className="text-gray-800 font-bold text-2xl leading-relaxed tracking-tight">
                                    {dailyReport.summary}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm focus:outline-none">
                        <h3 className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> {selectedDay || today} DAVOMAT</h3>
                        <div className="p-6 space-y-4">
                          {(() => {
                            const date = selectedDay || today;
                            const ci = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, date));
                            const co = state.reports.find(r => r.userId === selectedUser.id && r.date === date);
                            const lateness = ci ? getLatenessStatus(ci.timestamp, selectedUser.workingHours) : null;
                            const arrivalCardStyle = ci 
                              ? (lateness ? 'bg-red-50 border-red-300 shadow-red-100/50' : 'bg-green-50 border-green-100 shadow-green-100/50') 
                              : 'bg-red-50/50 border-red-100';
                            
                            return (
                              <>
                                <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-2 shadow-sm ${arrivalCardStyle}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl shadow-md ${ci ? (lateness ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-red-600 text-white'}`}><LogInIcon className="w-5 h-5" /></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kelish</p>
                                        {lateness && (
                                          <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                        )}
                                      </div>
                                      <p className={`text-2xl font-black leading-none mt-1 ${ci ? (lateness ? 'text-red-900' : 'text-gray-900') : 'text-red-900/40'}`}>
                                        {ci ? new Date(ci.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}).toUpperCase() : 'Kelmagan'}
                                      </p>
                                      {lateness && (
                                        <div className="mt-2 pt-2 border-t border-red-200 flex items-center gap-1.5 text-red-600 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>{lateness.durationStr} kechikish</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className={`p-6 rounded-[2rem] border flex items-center gap-4 shadow-sm transition-all ${co ? 'bg-blue-50 border-blue-100 shadow-blue-100/50' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                  <div className={`p-3 rounded-2xl shadow-md ${co ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}><LogOutIcon className="w-5 h-5" /></div>
                                  <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ketish</p>
                                    <p className="text-2xl font-black text-gray-900 leading-none mt-1">{co ? new Date(co.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}).toUpperCase() : 'Hali ketmagan'}</p>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-indigo-500" /> {selectedDay ? 'KUNDAGI FOTO' : 'OXIRGI FOTO'}
                        </h3>
                        {(() => {
                          const targetDate = selectedDay || today;
                          const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                          return dayCi ? (
                            <div 
                              className="relative group cursor-pointer overflow-hidden rounded-[1.5rem]"
                              onClick={() => setViewingPhoto(dayCi.photo)}
                            >
                              <img src={dayCi.photo} className="w-full h-40 object-cover shadow-sm border border-gray-50 group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-90 group-hover:scale-100 transition-transform">
                                  <Maximize2 className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-40 flex items-center justify-center text-gray-300 italic font-black text-xs uppercase tracking-widest bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-100">
                              {selectedDay ? 'Bu kunda foto yo\'q' : 'Hali foto yo\'q'}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" /> {selectedDay ? 'KUNDAGI JOYLAHUV' : 'OXIRGI JOYLAHUV'}
                        </h3>
                        {(() => {
                          const targetDate = selectedDay || today;
                          const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                          const initials = `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase();
                          return <SingleLocationMap location={dayCi?.location || null} initials={initials} />;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
          {pendingUsers.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">{u.firstName?.[0]}</div>
                <div><h4 className="text-lg font-black text-gray-900 leading-none mb-1">{u.firstName} {u.lastName}</h4><p className="text-xs text-gray-400 font-bold">{u.phone} • {u.role.replace('_', ' ')}</p></div>
              </div>
              <button onClick={() => approveUser(u.id)} className="p-4 bg-green-500 text-white rounded-2xl shadow-xl shadow-green-100 transition hover:bg-green-600"><CheckCircle className="w-6 h-6" /></button>
            </div>
          ))}
          {pendingUsers.length === 0 && <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 italic text-gray-400 font-bold uppercase tracking-widest text-[10px]">Yangi so'rovlar mavjud emas</div>}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-8 border-b border-gray-50"><h2 className="text-xl font-black text-gray-800">Barcha Kunlik Hisobotlar</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-8 py-4">Xodim</th><th className="px-8 py-4">Sana</th><th className="px-8 py-4">Xulosa</th><th className="px-8 py-4 text-right">Vaqt</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {state.reports.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((rep, idx) => {
                  const u = state.users.find(user => user.id === rep.userId);
                  return (
                    <tr 
                      key={idx} 
                      className="hover:bg-blue-50/50 transition cursor-pointer group"
                      onClick={() => {
                        setSelectedUserId(rep.userId);
                        setSelectedDay(rep.date);
                        setChartTimeframe('week');
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {u?.firstName?.[0]}{u?.lastName?.[0]}
                          </div>
                          <span className="font-bold text-gray-800">{u?.firstName} {u?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-400 font-medium">{rep.date}</td>
                      <td className="px-8 py-6 text-sm text-gray-700 italic leading-relaxed truncate max-w-xs">"{rep.summary}"</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            {new Date(rep.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        /* DANGER: Global Overrides for Chart Black Borders */
        .recharts-wrapper, .recharts-surface, .recharts-container {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .recharts-wrapper:focus, .recharts-wrapper:active, .recharts-wrapper * {
          outline: none !important;
          -webkit-tap-highlight-color: transparent;
        }
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line {
          stroke: #f1f5f9 !important;
        }
        .recharts-cartesian-axis-line {
          display: none !important;
        }
        .chart-wrapper svg {
          overflow: visible !important;
        }

        /* MODERN MAP MARKER V2 STYLES */
        .map-marker-v2-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 36px;
          height: 46px;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,0.25));
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .map-marker-v2-container:hover {
          transform: translateY(-4px) scale(1.1);
          z-index: 1000 !important;
        }
        .map-marker-v2-pin {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          color: white;
          position: relative;
          z-index: 2;
        }
        .map-marker-v2-initials {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .map-marker-v2-arrow {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid;
          margin-top: -2px;
          position: relative;
          z-index: 1;
        }
        .late-badge-v2 {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          z-index: 3;
        }
        .marker-pulse-v2::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: inherit;
          opacity: 0.4;
          animation: markerPulseV2 2s infinite;
          z-index: 0;
        }
        @keyframes markerPulseV2 {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .marker-late-v2 {
          background: #ef4444 !important;
          border-radius: 50%;
        }

        /* SINGLE MAP TEAR PIN */
        .map-marker-pin-tear {
          width: 40px;
          height: 40px;
          background: #2563eb;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
        }
        .pin-initials {
          transform: rotate(45deg);
          color: white;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: -0.01em;
        }
        .map-custom-tooltip {
          background: white;
          border: none;
          border-radius: 16px;
          box-shadow: 0 15px 35px -5px rgba(0,0,0,0.15);
          padding: 0;
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-sm hover:-translate-y-1 transition-all group">
    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p><p className="text-3xl font-black text-gray-900 leading-none">{value}</p></div>
    <div className={`${color} text-white p-5 rounded-2xl shadow-xl transition-all group-hover:scale-110 group-hover:rotate-6`}>{React.cloneElement(icon, { className: 'w-7 h-7' })}</div>
  </div>
);

const RefinedStatCard = ({ label, value, icon, color, onClick, isActive }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-5 rounded-2xl border-2 transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isActive ? 'ring-4 ring-blue-500/10 border-blue-500 shadow-xl' : 'border-gray-100 shadow-sm hover:border-blue-200'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-xl shadow-md`}>{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
      <div>
        <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</p>
        <p className="text-lg font-black text-gray-900 truncate max-w-[100px]">{value}</p>
      </div>
    </div>
  </div>
);

export default ManagerPanel;
