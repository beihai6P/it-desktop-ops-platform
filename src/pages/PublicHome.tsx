import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Cpu, Users, ArrowRight, ChevronRight, Star, Play, BookOpen, Wrench, MessageSquare, User, LayoutDashboard, LogOut, Menu, Globe } from 'lucide-react';

const navItems = [
  { id: 'diagnosis', label: '故障诊断', path: '/diagnosis' },
  { id: 'knowledge', label: '知识库', path: '/knowledge' },
  { id: 'community', label: '社区交流', path: '/community' },
  { id: 'tools', label: '工具分享', path: '/tools' },
];

const features = [
  {
    icon: Shield,
    title: '智能故障诊断',
    description: '基于AI的智能诊断系统，快速定位和解决桌面运维问题',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Users,
    title: '远程协作支持',
    description: '实时远程协助，高效解决用户问题，提升服务质量',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: BookOpen,
    title: '知识库管理',
    description: '丰富的运维知识库，提供解决方案和最佳实践',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Wrench,
    title: '工具分享平台',
    description: '运维工具共享，提升工作效率和团队协作能力',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
  },
];

const stats = [
  { value: '5000+', label: '累计诊断', change: '+12%' },
  { value: '98%', label: '用户满意度', change: '+2%' },
  { value: '2min', label: '平均响应', change: '-15%' },
  { value: '24/7', label: '全天候服务', change: '在线' },
];

const testimonials = [
  {
    name: '张工程师',
    role: 'IT运维主管',
    content: '这个平台极大地提升了我们团队的运维效率，智能诊断功能非常强大！',
    rating: 5,
  },
  {
    name: '李技术',
    role: '系统管理员',
    content: '知识库和工具分享功能让新人上手更快，强烈推荐！',
    rating: 5,
  },
  {
    name: '王经理',
    role: '技术总监',
    content: '远程协作功能太棒了，大大减少了现场支持的成本。',
    rating: 5,
  },
];

export default function PublicHome() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">IT</span>
              </div>
              <span className="text-xl font-bold text-theme-text">萌萌的运维人</span>
            </div>

            <nav className="hidden md:flex items-center gap-1" aria-label="主导航">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    管理后台
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      aria-haspopup="true"
                      aria-expanded={showUserMenu}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-theme-text hidden sm:inline">{user?.name}</span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-primary/20 py-2 z-50" role="menu">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-primary/5 transition-colors"
                          role="menuitem"
                        >
                          <User className="w-4 h-4 text-text-muted" />
                          <span className="text-sm text-theme-text">个人中心</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 transition-colors"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-500">退出登录</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    注册
                  </button>
                </>
              )}
              <button className="md:hidden p-2 hover:bg-primary/10 rounded-lg" aria-label="菜单">
                <Menu className="w-5 h-5 text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Cpu className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">萌萌的运维人</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-theme-text leading-tight mb-6">
                智能驱动
                <span className="text-primary"> IT运维 </span>
                新体验
              </h1>
              
              <p className="text-lg text-text-muted mb-8 max-w-xl">
                萌萌的运维人，一站式桌面运维互动平台，集成智能诊断、远程协作、知识库管理等核心功能，
                助力企业提升IT服务效率与质量。
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
                >
                  立即体验
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-8 py-4 bg-white border border-primary/20 text-theme-text font-semibold rounded-xl hover:bg-primary/5 transition-all"
                >
                  <Play className="w-5 h-5" />
                  观看演示
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-primary/10">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-full opacity-20"></div>
                
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center p-4 bg-gray-50/50 rounded-xl">
                      <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                      <div className="text-sm text-text-muted">{stat.label}</div>
                      <div className="text-xs text-green-600 mt-1">{stat.change}</div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-purple-50/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary rounded-full border-2 border-white flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-theme-text">128 位工程师在线</div>
                      <div className="text-xs text-text-muted">随时为您提供支持</div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-theme-text mb-4">核心功能</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              全方位的运维工具，满足日常运维需求
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-theme-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-theme-text mb-4">使用流程</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              简单三步，快速解决运维问题
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '发起诊断', description: '提交故障描述，系统自动分析问题', icon: MessageSquare },
              { step: '02', title: '智能分析', description: 'AI引擎分析问题，提供解决方案', icon: Cpu },
              { step: '03', title: '问题解决', description: '获得专业指导或远程协助', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-primary/10 h-full">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary/20 absolute top-4 right-4">{item.step}</div>
                    <h3 className="text-lg font-semibold text-theme-text mb-2">{item.title}</h3>
                    <p className="text-text-muted">{item.description}</p>
                  </div>
                  {item.step !== '03' && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ChevronRight className="w-8 h-8 text-primary/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-theme-text mb-4">用户评价</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              听听用户怎么说
            </p>
          </div>
          
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-primary/10 max-w-3xl mx-auto">
              <div className="flex items-center gap-1 mb-4" role="img" aria-label={`${testimonials[activeTestimonial].rating}星评价`}>
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <p className="text-lg text-theme-text mb-6">
                "{testimonials[activeTestimonial].content}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-theme-text">{testimonials[activeTestimonial].name}</div>
                  <div className="text-sm text-text-muted">{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="评价切换">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeTestimonial === index ? 'bg-primary w-8' : 'bg-primary/30'
                  }`}
                  role="tab"
                  aria-selected={activeTestimonial === index}
                  aria-label={`查看评价 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">准备好提升运维效率了吗？</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              加入我们的平台，体验智能化运维带来的效率革命
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg"
              >
                免费注册
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                了解更多
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-theme-bg border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">IT</span>
                </div>
                <span className="text-xl font-bold text-theme-text">萌萌的运维人</span>
              </div>
              <p className="text-text-muted text-sm">
                智能化桌面运维管理解决方案，提升IT服务效率与质量。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-theme-text mb-4">产品功能</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><button className="hover:text-primary transition-colors">智能诊断</button></li>
                <li><button className="hover:text-primary transition-colors">远程协作</button></li>
                <li><button className="hover:text-primary transition-colors">知识库</button></li>
                <li><button className="hover:text-primary transition-colors">工具分享</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-theme-text mb-4">关于我们</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><button className="hover:text-primary transition-colors">公司介绍</button></li>
                <li><button className="hover:text-primary transition-colors">联系我们</button></li>
                <li><button className="hover:text-primary transition-colors">加入我们</button></li>
                <li><button className="hover:text-primary transition-colors">帮助中心</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-theme-text mb-4">法律条款</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><button className="hover:text-primary transition-colors">服务条款</button></li>
                <li><button className="hover:text-primary transition-colors">隐私政策</button></li>
                <li><button className="hover:text-primary transition-colors">安全声明</button></li>
                <li><button className="hover:text-primary transition-colors">Cookie政策</button></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-primary/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
              <p className="text-sm text-text-muted">
                © 2026 萌萌的运维人. 保留所有权利.
              </p>
              <div className="flex items-center gap-6">
                <button className="text-sm text-text-muted hover:text-primary transition-colors">服务状态</button>
                <button className="text-sm text-text-muted hover:text-primary transition-colors">更新日志</button>
                <button className="text-sm text-text-muted hover:text-primary transition-colors">API文档</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
              <a 
                href="https://beian.miit.gov.cn/" 
                rel="noreferrer" 
                target="_blank"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="w-3 h-3" />
                浙ICP备2026000787号
              </a>
              <a 
                href="https://beian.mps.gov.cn/#/query/webSearch?code=33028202001171" 
                rel="noreferrer" 
                target="_blank"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <img src="/beian-icon.png" alt="公安备案" className="w-4 h-4 object-contain" />
                浙公网安备33028202001171号
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}