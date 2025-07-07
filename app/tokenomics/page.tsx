'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { getGudtekBalance, GUDTEK_TOKEN_MINT, formatTokenBalance } from '@/lib/wallet'
import { Connection } from '@solana/web3.js'
import Link from 'next/link'

const INITIAL_SUPPLY = 1_000_000_000 // 1B tokens
const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=e568033d-06d6-49d1-ba90-b3564c91851b'

const TEAM_WALLETS = [
  { name: 'Treasury', address: '3xmpZy4SFCp6wzqgk4Mh7jg1yF3ggvG5Xqkt3F9CEbLj' },
  { name: 'Operations', address: 'CXcG8pN7fT9VqgaJcfH8YzjzD4xfH14RJCdxu2YgSUn9' },
  { name: 'Marketing', address: '4HwME8YgUCnYJdeL9N2qHcNXTc3swaP42gnikLzeGWih' },
  { name: 'Liquidity', address: 'HkENe7A1Ji4VwWUvDdDhcW7UZ5EKeosFVJeFt3PcTJSd' }
]

type Goal = {
  name: string
  target: number
  value: number
  burn?: number
}

export default function TokenomicsPage() {
  const [burnedPercent, setBurnedPercent] = useState(0)
  const [teamPercent, setTeamPercent] = useState(0)
  const [wallets, setWallets] = useState<typeof TEAM_WALLETS>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [marketCap, setMarketCap] = useState(0)
  const [holdStart, setHoldStart] = useState<number | null>(null)

  // Fetch token supply and wallet balances
  useEffect(() => {
    const connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    })

    const fetchData = async () => {
      try {
        const supply = await connection.getTokenSupply(GUDTEK_TOKEN_MINT)
        const currentSupply = supply.value.uiAmount || 0
        const burned = INITIAL_SUPPLY - currentSupply
        setBurnedPercent((burned / INITIAL_SUPPLY) * 100)

        const updatedWallets = [] as typeof TEAM_WALLETS
        let teamTotal = 0
        for (const w of TEAM_WALLETS) {
          const bal = await getGudtekBalance(w.address)
          teamTotal += bal
          updatedWallets.push({ ...w, balance: bal })
        }
        setTeamPercent((teamTotal / INITIAL_SUPPLY) * 100)
        setWallets(updatedWallets as any)
      } catch (err) {
        console.error('Failed to fetch supply/wallet data', err)
      }
    }

    fetchData()
  }, [])

  // Fetch market cap & social metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('https://api.dexscreener.com/tokens/v1/solana/5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk')
        const data = await res.json()
        if (data && data.length > 0) {
          const cap = data[0].marketCap as number
          setMarketCap(cap)
        }
      } catch (err) {
        console.error('Failed to fetch token metrics', err)
      }

      try {
        const twRes = await fetch('https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=gudtek_solana')
        const twJson = await twRes.json()
        const followers = twJson?.[0]?.followers_count || 0

        const holdersRes = await fetch('https://public-api.solscan.io/token/holders?tokenAddress=5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk&offset=0&limit=1')
        const holdersJson = await holdersRes.json()
        const holders = holdersJson?.total || 0

        let telegram = 0
        try {
          const tgRes = await fetch('/api/telegram-members')
          const tgJson = await tgRes.json()
          telegram = tgJson?.count || 0
        } catch {}

        setGoals([
          { name: 'Twitter Followers', target: 10000, value: followers, burn: 0.5 },
          { name: 'Token Holders', target: 5000, value: holders },
          { name: 'Telegram Members', target: 2000, value: telegram }
        ])
      } catch (err) {
        console.error('Failed to fetch social metrics', err)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [])

  // Burn countdown logic
  useEffect(() => {
    const thresholds = Array.from({ length: 10 }, (_, i) => 100000 * (i + 1))
    const current = thresholds.find(t => marketCap < t) || 1000000
    const key = `mc_hold_${current}`

    if (marketCap >= current && current <= 1000000) {
      const start = Number(localStorage.getItem(key)) || Date.now()
      localStorage.setItem(key, start.toString())
      setHoldStart(start)
    } else {
      localStorage.removeItem(key)
      setHoldStart(null)
    }
  }, [marketCap])

  const countdown = holdStart ? Math.max(0, 24 * 3600 * 1000 - (Date.now() - holdStart)) : 0
  const countdownPct = holdStart ? ((24 * 3600 * 1000 - countdown) / (24 * 3600 * 1000)) * 100 : 0
  const nextThreshold = Math.min(Math.floor(marketCap / 100000) * 100000 + 100000, 1000000)

  const pieData = [
    { name: 'Burned', value: burnedPercent },
    { name: 'Team', value: teamPercent }
  ]
  const colors = ['#FF3B3B', '#FFA500']

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 overflow-hidden text-gray-900">
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>
      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto pt-24 px-4 flex flex-col gap-8">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">Tokenomics</h1>
        <p className="text-lg md:text-xl text-gray-800">Live transparency into the GUDTEK ecosystem.</p>

        {/* Pie Chart */}
        <div className="bg-white/30 rounded-xl border-2 border-gray-900 p-4 shadow-xl">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                {pieData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toFixed(2) + '%'} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Team Wallets */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Wallets</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>% Supply</TableHead>
                <TableHead>Solscan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map(w => (
                <TableRow key={w.address}>
                  <TableCell className="font-bold">{w.name}</TableCell>
                  <TableCell>{formatTokenBalance((w as any).balance || 0)}</TableCell>
                  <TableCell>{(((w as any).balance || 0) / INITIAL_SUPPLY * 100).toFixed(3)}%</TableCell>
                  <TableCell>
                    <Link href={`https://solscan.io/account/${w.address}`} target="_blank" className="text-blue-600 underline">View</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Goals */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Goals</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead className="w-32">Progress</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Current</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map(g => (
                <TableRow key={g.name}>
                  <TableCell className="font-bold">{g.name}{g.burn ? ` – Burn ${g.burn}%` : ''}</TableCell>
                  <TableCell>
                    <Progress value={Math.min(100, (g.value / g.target) * 100)} />
                  </TableCell>
                  <TableCell className="text-right">{g.target.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{g.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Burn Countdown */}
        <div className="bg-white/30 rounded-xl border-2 border-gray-900 p-4 shadow-xl">
          <h2 className="text-xl font-bold mb-2">Next Burn</h2>
          <p className="mb-2">1% burn every $100k in market cap (up to $1M) held for 24h.</p>
          <p className="mb-2">Current Market Cap: ${marketCap.toLocaleString()}</p>
          <p className="mb-2">Threshold: ${nextThreshold.toLocaleString()}</p>
          {holdStart ? (
            <div className="space-y-1">
              <Progress value={countdownPct * 100} />
              <p className="text-sm">{(countdown / 3600000).toFixed(1)} hrs remaining</p>
            </div>
          ) : (
            <p className="text-sm">Cap below threshold</p>
          )}
        </div>
      </div>
    </div>
  )
}

