
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudyProvider } from "./contexts/StudyContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import IndexPage from "./pages/Index";
import DeckPage from "./pages/Deck";
import AddDeckPage from "./pages/AddDeck";
import AddSubdeckPage from "./pages/AddSubdeck";
import AddQuestionPage from "./pages/AddQuestion";
import EditDeckPage from "./pages/EditDeck";
import EditQuestionPage from "./pages/EditQuestion";
import StudyPage from "./pages/Study";
import QuestionBankPage from "./pages/QuestionBank";
import PracticeTestPage from "./pages/PracticeTest";
import PracticeTestSession from "./pages/PracticeTestSession";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AccountDetails from "./pages/AccountDetails";
import AccountStats from "./pages/AccountStats";
import Leaderboard from "./pages/Leaderboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <StudyProvider>
          <BrowserRouter>
            <Layout>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><IndexPage /></ProtectedRoute>} />
              <Route path="/deck/:deckId" element={<ProtectedRoute><DeckPage /></ProtectedRoute>} />
              <Route path="/add-deck" element={<ProtectedRoute><AddDeckPage /></ProtectedRoute>} />
              <Route path="/deck/:deckId/add-subdeck" element={<ProtectedRoute><AddSubdeckPage /></ProtectedRoute>} />
              <Route path="/deck/:deckId/add-question" element={<ProtectedRoute><AddQuestionPage /></ProtectedRoute>} />
              <Route path="/deck/:deckId/edit" element={<ProtectedRoute><EditDeckPage /></ProtectedRoute>} />
              <Route path="/question/:questionId/edit" element={<ProtectedRoute><EditQuestionPage /></ProtectedRoute>} />
              <Route path="/study/:deckId" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
              <Route path="/question-bank" element={<ProtectedRoute><QuestionBankPage /></ProtectedRoute>} />
              <Route path="/practice-test" element={<ProtectedRoute><PracticeTestPage /></ProtectedRoute>} />
              <Route path="/practice-test/session/:deckId/:questionCount/:timed?" element={<ProtectedRoute><PracticeTestSession /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><AccountDetails /></ProtectedRoute>} />
              <Route path="/account/stats" element={<ProtectedRoute><AccountStats /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
          </BrowserRouter>
        </StudyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
