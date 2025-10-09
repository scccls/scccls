
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudyProvider } from "./contexts/StudyContext";
import { AuthProvider } from "./contexts/AuthContext";
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
              <Route path="/" element={<IndexPage />} />
              <Route path="/deck/:deckId" element={<DeckPage />} />
              <Route path="/add-deck" element={<AddDeckPage />} />
              <Route path="/deck/:deckId/add-subdeck" element={<AddSubdeckPage />} />
              <Route path="/deck/:deckId/add-question" element={<AddQuestionPage />} />
              <Route path="/deck/:deckId/edit" element={<EditDeckPage />} />
              <Route path="/question/:questionId/edit" element={<EditQuestionPage />} />
              <Route path="/study/:deckId" element={<StudyPage />} />
              <Route path="/question-bank" element={<QuestionBankPage />} />
              <Route path="/practice-test" element={<PracticeTestPage />} />
              <Route path="/practice-test/session/:deckId/:questionCount/:timed?" element={<PracticeTestSession />} />
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
