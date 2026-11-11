import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './layouts/AppLayout';
import Welcome from './screens/Welcome';
import Dashboard from './screens/Dashboard';
import TopicSelection from './screens/TopicSelection';
import SpeakingPractice from './screens/SpeakingPractice';
import Profile from './screens/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/topics" element={<TopicSelection />} />
          <Route path="/practice" element={<Navigate to="/practice/daily-life" replace />} />
          <Route path="/practice/:topicId" element={<SpeakingPractice />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
