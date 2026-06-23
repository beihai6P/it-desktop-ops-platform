import { useState, useEffect } from 'react';
import { AlertCircle, X, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginRequiredToastProps {
  show: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginRequiredToast({ show, onClose, message = '此操作需要先登录/注册账号' }: LoginRequiredToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/login');
  };

  if (!isVisible && !show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-theme-text mb-2">需要登录</h3>
              <p className="text-text-muted text-sm">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleLogin}
              className="flex-1 px-4 py-3 bg-gray-100 text-theme-text rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              去登录
            </button>
            <button
              onClick={handleRegister}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              去注册
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useLoginRequired() {
  const [showToast, setShowToast] = useState(false);

  const showLoginRequired = () => {
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const ToastComponent = () => (
    <LoginRequiredToast
      show={showToast}
      onClose={hideToast}
    />
  );

  return { showLoginRequired, hideToast, ToastComponent };
}