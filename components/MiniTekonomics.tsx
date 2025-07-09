"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { DollarSign } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatTokenBalance } from "@/lib/wallet"

interface SupplyData {
  totalSupply: number
  circulatingSupply: number
  totalLockedSupply: number
  totalLockedPercentage: number
  totalTeamBalance: number
  totalTeamPercentage: number
}

export default function MiniTekonomics() {
  const [supplyData, setSupplyData] = useState<SupplyData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    const fetchSupply = async () => {
      try {
        const res = await fetch("/api/total-supply")
        const data = await res.json()
        if (data.success) {
          setSupplyData(data.data)
          setLastUpdated(new Date())
        }
      } catch (err) {
        console.error("Failed fetching supply data", err)
      }
    }

    fetchSupply()
    const interval = setInterval(fetchSupply, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!supplyData) return null

  return (
    <section
      id="tekonomics"
      className="py-20 px-4 bg-gradient-to-br from-orange-400/50 to-yellow-300/50 relative backdrop-filter backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 flex items-center justify-center">
            <DollarSign className="mr-3 w-8 h-8" /> Tekonomics
          </h2>
          <p className="text-lg md:text-xl text-gray-800">
            Key $GUDTEK supply metrics — updated live ({lastUpdated.toLocaleTimeString()})
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <MetricCard label="Total Supply" value={formatTokenBalance(supplyData.totalSupply)} />
          <MetricCard label="Circulating" value={formatTokenBalance(supplyData.circulatingSupply)} />
          <MetricCard label="Locked" value={`${formatTokenBalance(supplyData.totalLockedSupply)} (${supplyData.totalLockedPercentage.toFixed(1)}%)`} />
          <MetricCard label="Team" value={`${formatTokenBalance(supplyData.totalTeamBalance)} (${supplyData.totalTeamPercentage.toFixed(1)}%)`} />
        </motion.div>

        {/* Supply Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16 max-w-3xl mx-auto"
        >
          <Card className="bg-white/15 border border-white/30 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-center text-lg font-bold text-gray-900">Supply Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Circulating", value: supplyData.circulatingSupply, color: "#22c55e" },
                        { name: "Locked", value: supplyData.totalLockedSupply, color: "#f97316" },
                        { name: "Team", value: supplyData.totalTeamBalance, color: "#facc15" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={2}
                    >
                      {[
                        "#22c55e",
                        "#f97316",
                        "#facc15",
                      ].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatTokenBalance(val as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-center mt-4 gap-6 text-sm font-medium text-gray-800">
                {[
                  { label: "Circulating", color: "#22c55e" },
                  { label: "Locked", color: "#f97316" },
                  { label: "Team", color: "#facc15" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 inline-block rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-center">
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold px-10 py-3 rounded-xl shadow-lg"
          >
            <a href="/tokenomics" aria-label="View full Tekonomics page">View Full Tekonomics</a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="group bg-white/15 border border-white/30 backdrop-blur-xl shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wide text-center">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:scale-105 transition-transform duration-300">
          {value}
        </div>
      </CardContent>
    </Card>
  )
} 