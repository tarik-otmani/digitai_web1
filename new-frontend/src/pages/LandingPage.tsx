import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Brain, Zap, Shield, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, useScroll, useTransform } from 'motion/react';

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div ref={targetRef} className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
                D
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">DigitAI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Testimonials</a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative perspective-1000">
        {/* Background Gradients with Parallax */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute top-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
          />
          <motion.div 
            style={{ y: y2, opacity }}
            className="absolute top-20 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
          />
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"
          />
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="relative z-10"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8 border border-indigo-100">
            <span className="flex w-2 h-2 bg-indigo-600 rounded-full mr-2 animate-pulse"></span>
            Reimagining Education
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6"
          >
            Revolutionize Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 animate-gradient">
              Teaching with AI
            </span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Create comprehensive courses, generate exams, and produce educational content in minutes. 
            Empower your teaching with personalized learning experiences.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/dashboard"
              className="group w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Creating for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="group w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 hover:-translate-y-1">
              View Demo
            </button>
          </motion.div>

          {/* Hero Image / Dashboard Preview */}
          <motion.div 
            variants={fadeInUp}
            className="mt-20 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50 group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none"></div>
            <motion.img 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.5 }}
              src="https://picsum.photos/seed/dashboard/1200/600" 
              alt="Dashboard Preview" 
              className="w-full h-auto object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
            >
              Everything you need to teach better
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed"
            >
              Our platform combines the power of generative AI with intuitive tools designed specifically for educators.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Course Generation",
                description: "Generate complete course structures, content, and learning objectives in seconds based on any topic."
              },
              {
                icon: Zap,
                title: "Instant Exam Creation",
                description: "Create quizzes and exams automatically from your course material with varying difficulty levels."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data and content are protected with enterprise-grade security and privacy controls."
              },
              {
                icon: CheckCircle,
                title: "Export Anywhere",
                description: "Export your courses to PDF, SCORM, or integrate directly with your LMS."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-600 max-w-2xl mx-auto text-lg"
            >
              Choose the plan that fits your needs. No hidden fees.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for trying out DigitAI",
                features: ["3 AI Course Generations/mo", "Basic Exam Creation", "PDF Export", "Community Support"],
                cta: "Get Started",
                popular: false
              },
              {
                name: "Pro",
                price: "$29",
                period: "/month",
                description: "For serious educators and creators",
                features: ["Unlimited Course Generation", "Advanced Exam Customization", "SCORM & HTML Export", "Priority Support", "Analytics Dashboard"],
                cta: "Start Pro Trial",
                popular: true
              },
              {
                name: "Institution",
                price: "Custom",
                description: "For schools and universities",
                features: ["Unlimited Users", "LMS Integration", "Custom Branding", "Dedicated Account Manager", "SSO & Advanced Security"],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
                className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-indigo-600 shadow-2xl shadow-indigo-600/10 scale-105 z-10' : 'border-gray-200 shadow-lg'} bg-white flex flex-col hover:border-indigo-300 transition-colors duration-300`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg shadow-indigo-600/20">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 font-medium">{plan.period}</span>}
                  </div>
                  <p className="text-gray-500 mt-4 leading-relaxed">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-indigo-600" />
                      </div>
                      <span className="text-gray-600 text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30' : 'bg-gray-50 text-gray-900 hover:bg-gray-100 hover:text-indigo-600'}`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                  D
                </div>
                <span className="text-xl font-bold tracking-tight">DigitAI</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                Empowering educators with next-generation AI tools to create engaging, personalized, and effective learning experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-gray-100">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-gray-100">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">
              © 2024 DigitAI. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
