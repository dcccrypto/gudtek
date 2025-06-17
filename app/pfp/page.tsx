'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Trophy, Sparkles, AlertCircle, CheckCircle, Download, Wallet, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatTokenBalance, formatSolBalance, getWalletInfo } from '@/lib/wallet';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createBurnCheckedInstruction } from '@solana/spl-token';

// Minimum token requirement to access PFP generator
const MIN_GUDTEK_BALANCE = 20000;

// Token burn amount for downloading PFP
const USD_BURN_AMOUNT = 1;

const GUDTEK_MINT = new PublicKey('5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk');
const DECIMALS = 6;

const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pfps`; // trailing no slash needed

interface PFPGeneration {
  id: string;
  preview_url: string;
  original_filename: string;
  status: 'preview' | 'downloaded';
  created_at: string;
}

export default function PFPGenerator() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { toast } = useToast();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [generations, setGenerations] = useState<PFPGeneration[]>([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [currentPreview, setCurrentPreview] = useState<PFPGeneration | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const PREVIEW_LIMIT = 3;
  // Count active previews that haven't been downloaded yet
  const previewsUsed = generations.filter((g) => g.status === 'preview').length;
  const previewsRemaining = Math.max(0, PREVIEW_LIMIT - previewsUsed);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Game", href: "/game" },
    { name: "Announcements", href: "/announcements" },
    { name: "Memes", href: "/memes" },
    { name: "GUD AI", href: "/pfp" },
  ];

  const supabase = createClient();

  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchData = async () => {
      try {
        setWalletLoading(true);

        // balance refresh
        const info = await getWalletInfo(publicKey.toString());
        setTokenBalance(info.gudtekBalance);
        setSolBalance(info.solBalance);

        // fetch generations via server API to bypass RLS
        const res = await fetch('/api/pfp/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: publicKey.toString() }),
        });

        if (!res.ok) throw new Error('Failed to fetch generations');
        const { generations: genData } = await res.json();
        setGenerations(genData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setWalletLoading(false);
      }
    };

    fetchData();
  }, [connected, publicKey]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const generatePreview = async () => {
    if (!connected || !publicKey) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    if (tokenBalance < MIN_GUDTEK_BALANCE) {
      toast({
        title: 'Insufficient Balance',
        description: `You need at least ${MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK to use the PFP generator.`,
        variant: 'destructive',
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: 'Empty Prompt',
        description: 'Please enter a prompt to generate an image.',
        variant: 'destructive',
      });
      return;
    }

    if (previewsRemaining <= 0) {
      toast({
        title: 'Preview Limit Reached',
        description: `You have used all ${PREVIEW_LIMIT} preview slots. Download or delete an existing preview to generate more.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setCurrentPreview(null);

    try {
      // Show toast to indicate generation has started
      toast({
        title: 'Generating Image',
        description: 'This may take up to 30 seconds. Please wait...',
      });

      // Implement a 60-second timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      const res = await fetch('/api/pfp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          wallet: publicKey.toString() 
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const data = await res.json();
      
      // Set as current preview
      setCurrentPreview(data);

      // Add to generations list
      setGenerations(prev => [data, ...prev]);

      toast({
        title: 'Success',
        description: 'Your PFP preview has been generated!',
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to generate preview. Please try again with a different prompt.';
      toast({
        title: 'Generation Failed',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPFP = async (id: string) => {
    if (!connected || !publicKey) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    // skip cached balance check; rely on on-chain burn

    setIsDownloading(true);

    try {
      // fetch live price
      const priceRes = await fetch('https://api.dexscreener.com/tokens/v1/solana/5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk');
      const priceJson = await priceRes.json();
      const price = parseFloat(priceJson?.[0]?.priceUsd || '0');
      if (!price) throw new Error('Unable to fetch token price');
      const tokensToBurn = Math.ceil(USD_BURN_AMOUNT / price);

      // build burn
      const ata = await getAssociatedTokenAddress(GUDTEK_MINT, publicKey as PublicKey);
      const ix = createBurnCheckedInstruction(ata, GUDTEK_MINT, publicKey as PublicKey, tokensToBurn * 10 ** DECIMALS, DECIMALS);
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');

      const res = await fetch(`/api/pfp/download/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toString(), txSignature: sig, tokenAmount: tokensToBurn }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to download');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'GUDTEK_PFP.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh data after download
      refreshData();

      toast({
        title: 'Success',
        description: `Downloaded! Burned ${tokensToBurn.toLocaleString()} $GUDTEK on-chain`,
        action: (
          <ToastAction altText="View Transaction" onClick={() => window.open(`https://solscan.io/tx/${sig}`, '_blank')}>View Tx</ToastAction>
        )
      });
    } catch (error) {
      const errMsg2 = error instanceof Error ? error.message : 'Failed to download. Please try again.';
      toast({
        title: 'Error',
        description: errMsg2,
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const refreshData = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setWalletLoading(true);
      
      // balance refresh
      const info = await getWalletInfo(publicKey.toString());
      setTokenBalance(info.gudtekBalance);
      setSolBalance(info.solBalance);

      // generations via server route
      const res = await fetch('/api/pfp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      });
      if (res.ok) {
        const { generations: genData } = await res.json();
        setGenerations(genData || []);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const canUseGenerator = connected && publicKey && tokenBalance >= MIN_GUDTEK_BALANCE;
  const canGeneratePreview = canUseGenerator && previewsRemaining > 0;

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
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      item.href === '/pfp'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-900 hover:bg-orange-500/20'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsNavOpen(!isNavOpen)}
              >
                {isNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isNavOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.href === '/pfp'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-900 hover:bg-orange-500/20'
                  }`}
                onClick={() => setIsNavOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        )}
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">GUDTEK PFP Forge</h1>
            <p className="text-lg text-gray-800">Combine cutting-edge AI with your imagination to forge a one-of-a-kind GUDTEK mascot avatar.</p>
          </div>

          {/* Wallet Connection Section - Styled like the game page */}
          <div className="mb-8">
            <Card className="bg-white/80 backdrop-blur-md border-orange-300 shadow-lg overflow-hidden">
              <CardContent className="p-6">
                {!connected ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Wallet className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                      <p className="text-gray-700 mb-4">
                        Connect your Solana wallet to generate and download custom profile pictures.
                      </p>
                      <div className="flex justify-center">
                        <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
                      <div className="p-3 bg-orange-100 rounded-full mr-0 md:mr-4 mb-3 md:mb-0">
                        <Wallet className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-bold text-gray-900 mr-2">Wallet Connected</h3>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center bg-orange-100 px-3 py-2 rounded-lg">
                        <img
                          src="/images/gudtek-logo.png"
                          alt="GUDTEK"
                          className="h-5 w-5 rounded-full mr-2"
                        />
                        <div>
                          <p className="text-xs text-gray-600">$GUDTEK Balance</p>
                          <p className="font-bold text-gray-900">
                            {walletLoading ? (
                              <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
                            ) : (
                              formatTokenBalance(tokenBalance)
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-orange-100 px-3 py-2 rounded-lg">
                        <img
                          src="/game/sol.png"
                          alt="SOL"
                          className="h-5 w-5 mr-2"
                        />
                        <div>
                          <p className="text-xs text-gray-600">SOL Balance</p>
                          <p className="font-bold text-gray-900">
                            {walletLoading ? (
                              <span className="inline-block w-12 h-4 bg-gray-200 animate-pulse rounded"></span>
                            ) : (
                              formatSolBalance(solBalance)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Alert */}
          {connected && (
            <div className="mb-8">
              {tokenBalance < MIN_GUDTEK_BALANCE ? (
                <Alert className="bg-red-50 border-red-300 text-red-800">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <AlertDescription>
                    You need at least {MIN_GUDTEK_BALANCE.toLocaleString()} $GUDTEK tokens to use the PFP generator.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-300 text-green-800">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <AlertDescription>
                    You have enough $GUDTEK tokens to use the PFP generator. Generating a preview is free, but downloading costs ${USD_BURN_AMOUNT} USD worth of $GUDTEK.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Generator Section */}
            <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Forge New Avatar
                  </CardTitle>
                </CardHeader>
                <CardContent>
              <div className="space-y-4">
                {!connected ? (
                      <div className="text-center space-y-4 py-8">
                    <p className="text-lg font-semibold text-gray-900">Connect your wallet to start generating PFPs</p>
                        <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !border !border-gray-900 !rounded !font-bold !shadow-sm !px-6 !py-3 !text-sm !h-12 !min-w-0 mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col space-y-2">
                          <label className="text-gray-900 font-semibold">Enter your prompt</label>
                      <Textarea
                        value={prompt}
                        onChange={handlePromptChange}
                            placeholder="Tell the forge what your perfect GUDTEK mascot looks like…"
                        className="min-h-[100px] bg-[#ffd96633] border-2 border-[#ffd966] text-gray-900 rounded-xl text-lg font-medium px-4 py-3"
                      />
                          <p className="text-sm text-gray-700">
                            Our AI will enhance your prompt to create the best possible image.
                          </p>
                    </div>

                    <Button
                      onClick={generatePreview}
                          disabled={isLoading || !prompt.trim() || !canGeneratePreview}
                          className={`
                            w-full font-bold text-lg py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed
                            ${canGeneratePreview 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-2 border-green-300 shadow-green-500/50' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 border-2 border-gray-300 shadow-gray-500/30 cursor-not-allowed'
                            }
                          `}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </div>
                      ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Sparkles className="w-5 h-5" />
                              <span>Forge Preview</span>
                            </div>
                      )}
                    </Button>
                  </>
                )}
              </div>
                </CardContent>
            </Card>
              
              {/* Current Preview */}
              {currentPreview && (
                <Card className="overflow-hidden bg-white/10 backdrop-blur-sm border-white/20">
                  <div className="relative aspect-square">
                    <Image 
                      src={currentPreview.preview_url} 
                      alt="Generated PFP" 
                      fill 
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
                      Preview
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm text-gray-800 font-medium">
                      Burn ${USD_BURN_AMOUNT} worth of $GUDTEK to download without watermark
                    </p>
                    {connected ? (
                      <Button 
                        onClick={() => downloadPFP(currentPreview.id)} 
                        disabled={isDownloading || tokenBalance < USD_BURN_AMOUNT}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Burn ${USD_BURN_AMOUNT} $GUDTEK
                          </>
                        )}
                      </Button>
                    ) : (
                      <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !border !border-gray-900 !rounded !font-bold !shadow-sm !w-full !py-2" />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Gallery Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Your Avatar Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connected ? (
                  generations.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {generations.map((gen) => {
                    const imgSrc = gen.status === 'downloaded' && gen.original_filename
                      ? `${SUPABASE_STORAGE_URL}/${gen.original_filename}`
                      : gen.preview_url;
                    return (
                    <div key={gen.id} className="relative group">
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-300 group-hover:border-orange-500 transition-all">
                        <Image
                          src={imgSrc}
                          alt="Generated PFP"
                          fill
                          className="object-cover"
                        />
                            {gen.status === 'preview' ? (
                              <div className="absolute bottom-0 right-0 bg-orange-500 text-white px-2 py-1 text-xs font-bold">
                                PREVIEW
                              </div>
                            ) : (
                              <div className="absolute bottom-0 right-0 bg-green-500 text-white px-2 py-1 text-xs font-bold">
                                DOWNLOADED
                              </div>
                            )}
                          </div>
                          
                        {gen.status === 'preview' && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                            <Button
                                onClick={() => downloadPFP(gen.id)}
                                disabled={isDownloading || tokenBalance < USD_BURN_AMOUNT}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-700">Nothing here yet. Fire up the forge and craft your first avatar!</p>
                </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-700 mb-4">Connect your wallet to view your generations</p>
                    <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !border !border-gray-900 !rounded !font-bold !shadow-sm !px-6 !py-3 !text-sm !h-12 !min-w-0 mx-auto" />
              </div>
                )}
                {connected && (
                  <p className="text-sm text-gray-700 font-semibold mb-2">
                    Previews remaining: {previewsRemaining} / {PREVIEW_LIMIT}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 