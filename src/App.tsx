import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TournamentProvider } from './contexts/TournamentContext';
import { AuctionProvider } from './contexts/AuctionContext';

// Layouts
import { PublicLayout } from './components/common/PublicLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { TournamentPage } from './pages/public/TournamentPage';
import { PlayersPage } from './pages/public/PlayersPage';
import { PlayerDetailPage } from './pages/public/PlayerDetailPage';
import { TeamsPage } from './pages/public/TeamsPage';
import { TeamDetailPage } from './pages/public/TeamDetailPage';
import { PublicAuctionPage } from './pages/public/PublicAuctionPage';
import { ResultsPage } from './pages/public/ResultsPage';
import { StandingsPage } from './pages/public/StandingsPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { RulesPage } from './pages/public/RulesPage';
import { ContactPage } from './pages/public/ContactPage';
import { AdminLoginPage } from './pages/public/AdminLoginPage';

// Projector & Team Portal
import { ProjectorPage } from './pages/projector/ProjectorPage';
import { TeamBiddingPortal } from './pages/team/TeamBiddingPortal';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTournament } from './pages/admin/AdminTournament';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminPlayers } from './pages/admin/AdminPlayers';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAuction } from './pages/admin/AdminAuction';
import { AdminAuctionHistory } from './pages/admin/AdminAuctionHistory';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminStandings } from './pages/admin/AdminStandings';
import { AdminGallery } from './pages/admin/AdminGallery';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSettings } from './pages/admin/AdminSettings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TournamentProvider>
          <AuctionProvider>
            <Routes>
              {/* Public Website Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="tournament" element={<TournamentPage />} />
                <Route path="players" element={<PlayersPage />} />
                <Route path="players/:id" element={<PlayerDetailPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="teams/:id" element={<TeamDetailPage />} />
                <Route path="auction" element={<PublicAuctionPage />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="standings" element={<StandingsPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="rules" element={<RulesPage />} />
                <Route path="contact" element={<ContactPage />} />
              </Route>

              {/* Dedicated Fullscreen Projector Route (1920x1080) */}
              <Route path="/projector" element={<ProjectorPage />} />

              {/* Team Bidding Portal */}
              <Route path="/team-bid" element={<TeamBiddingPortal />} />
              <Route path="/team-bid/:teamId" element={<TeamBiddingPortal />} />

              {/* Admin Login Route */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Admin Console Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="tournament" element={<AdminTournament />} />
                <Route path="teams" element={<AdminTeams />} />
                <Route path="players" element={<AdminPlayers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="auction" element={<AdminAuction />} />
                <Route path="history" element={<AdminAuctionHistory />} />
                <Route path="results" element={<AdminResults />} />
                <Route path="standings" element={<AdminStandings />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuctionProvider>
        </TournamentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
