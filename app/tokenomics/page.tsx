'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatTokenBalance } from '@/lib/wallet'
import Link from 'next/link'

const INITIAL_SUPPLY = 1_000_000_000 // 1B tokens

const TEAM_WALLETS = [
  { name: 'Treasury', address: '3xmpZy4SFCp6wzqgk4Mh7jg1yF3ggvG5Xqkt3F9CEbLj', balance: 250_000_000 },
  { name: 'Operations', address: 'CXcG8pN7fT9VqgaJcfH8YzjzD4xfH14RJCdxu2YgSUn9', balance: 50_000_000 },
  { name: 'Marketing', address: '4HwME8YgUCnYJdeL9N2qHcNXTc3swaP42gnikLzeGWih', balance: 30_000_000 },
  { name: 'Liquidity', address: 'HkENe7A1Ji4VwWUvDdDhcW7UZ5EKeosFVJeFt3PcTJSd', balance: 120_000_000 }
]

const GOALS = [
  { name: 'Twitter Followers', target: 10000, value: 4200, burn: 0.5 },
  { name: 'Token Holders', target: 5000, value: 1300 },
  { name: 'Telegram Members', target: 2000, value: 800 }
]

export default function TokenomicsPage() {
  const [now, setNow] = useState(Date.now())
  // pretend the market cap recently crossed $400k
  const marketCap = 450_000
  const nextThreshold = 500_000
  const holdStart = Date.now() - 12 * 60 * 60 * 1000 // halfway through 24h hold

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const countdown = Math.max(0, 24 * 60 * 60 * 1000 - (now - holdStart))
  const countdownPct = ((24 * 60 * 60 * 1000 - countdown) / (24 * 60 * 60 * 1000)) * 100

  const burnedTokens = 150_000_000
  const burnedPercent = (burnedTokens / INITIAL_SUPPLY) * 100
  const teamTotal = TEAM_WALLETS.reduce((acc, w) => acc + w.balance, 0)
  const teamPercent = (teamTotal / INITIAL_SUPPLY) * 100

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
              {TEAM_WALLETS.map(w => (
                <TableRow key={w.address}>
                  <TableCell className="font-bold">{w.name}</TableCell>
                  <TableCell>{formatTokenBalance(w.balance)}</TableCell>
                  <TableCell>{((w.balance / INITIAL_SUPPLY) * 100).toFixed(3)}%</TableCell>
                  <TableCell>
                    <Link href={`https://solscan.io/account/${w.address}`} target="_blank" className="text-blue-600 underline">View</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
              {GOALS.map(g => (
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

        <div className="bg-white/30 rounded-xl border-2 border-gray-900 p-4 shadow-xl">
          <h2 className="text-xl font-bold mb-2">Next Burn</h2>
          <p className="mb-2">1% burn every $100k in market cap (up to $1M) held for 24h.</p>
          <p className="mb-2">Current Market Cap: ${marketCap.toLocaleString()}</p>
          <p className="mb-2">Threshold: ${nextThreshold.toLocaleString()}</p>
          <div className="space-y-1">
            <Progress value={countdownPct * 100} />
            <p className="text-sm">{(countdown / 3600000).toFixed(1)} hrs remaining</p>
          </div>
        </div>
      </div>
    </div>
  )
}

