
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Home, FileUp, Menu, FileQuestion, BookCheck, LogOut, LogIn, User, BarChart3 } from "lucide-react";
import ImportDeckDialog from "./ImportDeckDialog";
import { useStudy } from "@/contexts/StudyContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { state } = useStudy();
  const { user, signOut } = useAuth();
  const hasQuestions = state.questionBank.length > 0;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <Link to="/" className="font-semibold text-2xl">
            SCC CLS Website
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex ml-auto space-x-1">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className="flex items-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/question-bank">
              <Button
                variant={isActive("/question-bank") ? "default" : "ghost"}
                className={`flex items-center ${hasQuestions && !isActive("/question-bank") ? "text-red-500 hover:text-red-600" : ""}`}
              >
                <FileQuestion className={`h-4 w-4 mr-2 ${hasQuestions && !isActive("/question-bank") ? "text-red-500" : ""}`} />
                Question Bank
                {hasQuestions && !isActive("/question-bank") && (
                  <Badge variant="destructive" className="ml-2">{state.questionBank.length}</Badge>
                )}
              </Button>
            </Link>
            <Link to="/practice-test">
              <Button
                variant={isActive("/practice-test") ? "default" : "ghost"}
                className="flex items-center"
              >
                <BookCheck className="h-4 w-4 mr-2" />
                Tests
              </Button>
            </Link>
            <ImportDeckDialog>
              <Button
                variant="ghost"
                className="flex items-center"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportDeckDialog>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem asChild className="flex items-center">
                    <Link to="/account">
                      <User className="h-4 w-4 mr-2" />
                      Account Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="flex items-center">
                    <Link to="/account/stats">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Account Stats
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
          
          {/* Mobile Navigation */}
          <div className="md:hidden ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/question-bank" className="flex items-center">
                    <FileQuestion className={`h-4 w-4 mr-2 ${hasQuestions && !isActive("/question-bank") ? "text-red-500" : ""}`} />
                    Question Bank
                    {hasQuestions && !isActive("/question-bank") && (
                      <Badge variant="destructive" className="ml-2">{state.questionBank.length}</Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/practice-test" className="flex items-center">
                    <BookCheck className="h-4 w-4 mr-2" />
                    Tests
                  </Link>
                </DropdownMenuItem>
                <ImportDeckDialog>
                  <DropdownMenuItem className="flex items-center">
                    <FileUp className="h-4 w-4 mr-2" />
                    Import
                  </DropdownMenuItem>
                </ImportDeckDialog>
                {user ? (
                  <>
                    <DropdownMenuItem asChild className="flex items-center">
                      <Link to="/account">
                        <User className="h-4 w-4 mr-2" />
                        Account Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="flex items-center">
                      <Link to="/account/stats">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Account Stats
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 px-4 sm:px-6">
        {children}
      </main>
    </div>
  );
};


export default Layout;
