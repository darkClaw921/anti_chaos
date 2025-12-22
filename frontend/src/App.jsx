import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import WelcomeScreen from './components/WelcomeScreen'
import FormatExplanation from './components/FormatExplanation'
import SphereRating from './components/SphereRating'
import SphereSelection from './components/SphereSelection'
import SpiderChart from './components/SpiderChart'
import DailyQuestion from './components/DailyQuestion'
import Confirmation from './components/Confirmation'
import MiniReward from './components/MiniReward'
import DailySummary from './components/DailySummary'
import Progress from './components/Progress'
import WeeklySummary from './components/WeeklySummary'
import MonthlyReport from './components/MonthlyReport'
import Menu from './components/Menu'
import Account from './components/Account'
import Settings from './components/Settings'
import ChangeFocusSpheres from './components/ChangeFocusSpheres'
import ReturnAfterPause from './components/ReturnAfterPause'
import SimpleQuestion from './components/SimpleQuestion'
import QuestionDatabase from './components/QuestionDatabase'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WelcomeScreen />} />
          <Route path="format" element={<FormatExplanation />} />
          <Route path="rating" element={<SphereRating />} />
          <Route path="selection" element={<SphereSelection />} />
          <Route path="chart" element={<SpiderChart />} />
          <Route path="daily" element={<DailyQuestion />} />
          <Route path="confirmation" element={<Confirmation />} />
          <Route path="reward" element={<MiniReward />} />
          <Route path="summary" element={<DailySummary />} />
          <Route path="progress" element={<Progress />} />
          <Route path="weekly" element={<WeeklySummary />} />
          <Route path="monthly" element={<MonthlyReport />} />
          <Route path="menu" element={<Menu />} />
          <Route path="account" element={<Account />} />
          <Route path="settings" element={<Settings />} />
          <Route path="change-spheres" element={<ChangeFocusSpheres />} />
          <Route path="return" element={<ReturnAfterPause />} />
          <Route path="simple" element={<SimpleQuestion />} />
          <Route path="questions-database" element={<QuestionDatabase />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

