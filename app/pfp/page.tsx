'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Menu, X, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

interface PFPQuota {
  previews_used: number;
  last_preview_at: string | null;
}

interface PFPGeneration {
  id: string;
  preview_url: string;
  status: 'preview' | 'downloaded';
  created_at: string;
}

export default function PFPGenerator() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<PFPQuota | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [generations, setGenerations] = useState<PFPGeneration[]>([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [prompt, setPrompt] = useState("Gud Tek Mascot");
  const basePrompt = "Gud Tek Mascot";

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Game", href: "/game" },
    { name: "Announcements", href: "/announcements" },
    { name: "Hackathon", href: "/#hackathon" },
    { name: "Tokenomics", href: "/#tokenomics" },
    { name: "How to Buy", href: "/#how-to-buy" },
    { name: "Chart", href: "/#chart" },
    { name: "Memes", href: "/memes" },
    { name: "Community", href: "/#community" },
    { name: "About", href: "/#about" },
  ];

  const supabase = createClient();

  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchData = async () => {
      try {
        // Get token balance
        const balanceRes = await fetch(`/api/game/verify-holder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: publicKey.toString() })
        });
        
        if (!balanceRes.ok) {
          throw new Error('Failed to fetch balance');
        }
        const balanceText = await balanceRes.text();
        let balanceData;
        try {
          balanceData = JSON.parse(balanceText);
        } catch (e) {
          console.error('Failed to parse balance response:', balanceText);
          balanceData = { tokenBalance: 0 };
        }
        setTokenBalance(balanceData.tokenBalance || 0);

        // Get quota
        const { data: quotaData } = await supabase
          .from('pfp_quotas')
          .select('previews_used, last_preview_at')
          .eq('wallet_address', publicKey.toString())
          .single();
        
        setQuota(quotaData || { previews_used: 0, last_preview_at: null });

        // Get generations
        const { data: genData } = await supabase
          .from('pfp_generations')
          .select('id, preview_url, status, created_at')
          .eq('wallet_address', publicKey.toString())
          .order('created_at', { ascending: false });

        setGenerations(genData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your data. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [connected, publicKey]);

  useEffect(() => {
    if (!quota?.last_preview_at) return;

    const lastPreview = new Date(quota.last_preview_at).getTime();
    const updateCooldown = () => {
      const now = Date.now();
      const diff = Math.max(0, 30000 - (now - lastPreview));
      setCooldown(Math.ceil(diff / 1000));
    };

    const interval = setInterval(updateCooldown, 1000);
    updateCooldown();

    return () => clearInterval(interval);
  }, [quota?.last_preview_at]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.startsWith(basePrompt)) {
      setPrompt(newValue);
    } else {
      setPrompt(basePrompt);
    }
  };

  const generatePreview = async () => {
    console.log('Generate preview clicked');
    
    if (!connected || !publicKey) {
      console.log('Wallet not connected');
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    if (tokenBalance < 10000) {
      console.log('Insufficient balance:', tokenBalance);
      toast({
        title: 'Insufficient Balance',
        description: 'You need at least 10,000 $GUDTEK to use the PFP generator.',
        variant: 'destructive',
      });
      return;
    }

    if (quota && quota.previews_used >= 3) {
      console.log('Daily quota exceeded:', quota.previews_used);
      toast({
        title: 'Daily Quota Exceeded',
        description: 'You have used all your free previews for today.',
        variant: 'destructive',
      });
      return;
    }

    if (cooldown > 0) {
      console.log('Cooldown active:', cooldown);
      toast({
        title: 'Cooldown Active',
        description: `Please wait ${cooldown} seconds before generating another preview.`,
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting generation with prompt:', prompt);
    setIsLoading(true);

    try {
      console.log('Making API request');
      const res = await fetch('/api/pfp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          wallet: publicKey.toString() 
        }),
      });

      console.log('API response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: 'Unknown error occurred' };
        }
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const data = await res.json();
      console.log('Generation successful:', data);
      
      // Refresh data
      const { data: quotaData } = await supabase
        .from('pfp_quotas')
        .select('previews_used, last_preview_at')
        .eq('wallet_address', publicKey.toString())
        .single();
      
      setQuota(quotaData);

      // Add new generation to the list
      setGenerations(prev => [data, ...prev]);

      toast({
        title: 'Success',
        description: 'Your PFP preview has been generated!',
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadHQ = async (id: string) => {
    if (!connected || !publicKey) return;

    try {
      const res = await fetch(`/api/pfp/download/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      });

      if (!res.ok) throw new Error('Failed to download');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gudtek-pfp-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh generations
      const { data: genData } = await supabase
        .from('pfp_generations')
        .select('id, preview_url, status, created_at')
        .eq('wallet_address', publicKey.toString())
        .order('created_at', { ascending: false });

      setGenerations(genData || []);

      toast({
        title: 'Download Complete',
        description: 'Your high-quality PFP has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      {/* Navbar - Matching main site */}
      <nav className="fixed left-0 right-0 top-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b-2 border-orange-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Logo/Site Title */}
              <Link href="/" className="flex-shrink-0 flex items-center">
                <img
                  src="/images/gudtek-logo.png"
                  alt="Gud Tek Logo"
                  className="h-8 w-8 rounded-full mr-2"
                  width={32}
                  height={32}
                />
                <span className="text-gray-900 font-black text-xl tracking-tight">GUD TEK</span>
              </Link>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-800 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            {/* Mobile Nav Button */}
            <div className="-mr-2 flex md:hidden">
              <Button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 bg-transparent hover:bg-transparent"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isNavOpen ? (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <X className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isNavOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/20 backdrop-filter backdrop-blur-lg border-t border-orange-400/30">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-800 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setIsNavOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border-2 border-gray-900/20 rounded-full px-6 py-3 mb-6 shadow-xl">
              <Trophy className="w-6 h-6 text-gray-900" />
              <span className="text-lg font-black text-gray-900">AI PFP GENERATOR</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              Create Your PFP
            </h1>
            <p className="text-xl font-bold text-gray-800 max-w-2xl mx-auto">
              Create unique profile pictures with our AI-powered generator. Requires ≥10,000 $GUDTEK to access.
            </p>
          </motion.div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Generator Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="space-y-4">
                {!connected ? (
                  <div className="text-center space-y-4">
                    <p className="text-lg font-semibold text-gray-900">Connect your wallet to start generating PFPs</p>
                    <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 transition mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col space-y-2">
                      <label className="text-gray-900 font-semibold">Prompt</label>
                      <Textarea
                        value={prompt}
                        onChange={handlePromptChange}
                        onFocus={(e) => {
                          // Place cursor at end when focusing
                          const len = e.target.value.length;
                          e.target.setSelectionRange(len, len);
                        }}
                        className="min-h-[100px] bg-[#ffd96633] border-2 border-[#ffd966] text-gray-900 rounded-xl text-lg font-medium px-4 py-3"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Daily Previews</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={((quota?.previews_used || 0) / 3) * 100} className="w-32" />
                          <span className="text-sm text-gray-700">{quota?.previews_used || 0}/3</span>
                        </div>
                      </div>

                      {cooldown > 0 && (
                        <Badge variant="outline" className="bg-white/20">
                          Cooldown: {cooldown}s
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={generatePreview}
                      disabled={isLoading || cooldown > 0 || (quota?.previews_used || 0) >= 3}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate Preview'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Gallery Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Your Generations</h3>
                <div className="grid grid-cols-2 gap-4">
                  {generations.map((gen) => (
                    <div key={gen.id} className="relative group">
                      <div className="aspect-square relative overflow-hidden rounded-lg">
                        <Image
                          src={gen.preview_url}
                          alt="Generated PFP"
                          fill
                          className="object-cover"
                        />
                        {gen.status === 'preview' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => downloadHQ(gen.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              Download HQ
                            </Button>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`absolute top-2 right-2 ${
                          gen.status === 'downloaded' ? 'bg-green-500' : 'bg-orange-500'
                        } text-white`}
                      >
                        {gen.status === 'downloaded' ? 'HQ' : 'Preview'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 