"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function StudentClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClub, setCurrentClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      const res = await fetch("/api/student/clubs");
      const data = await res.json();
      setClubs(data.clubs || []);
      setCurrentClub(data.currentClub || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function joinClub(club_id: string) {
    setJoining(true);
    try {
      const res = await fetch("/api/student/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id }),
      });
      if (res.ok) {
        fetchClubs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto py-8">
        <h1 className="text-4xl font-black text-white mb-4">
          Choose Your <span className="text-neon-green">Club / Department</span>
        </h1>
        <p className="text-muted-foreground">
          Join a club to get specialized tasks, participate in department events, and connect with peers in your field.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10"><p className="text-muted-foreground">Loading clubs...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((c) => {
            const isCurrent = currentClub?.id === c.id;
            return (
              <Card key={c.id} className={\`transition-all \${isCurrent ? 'border-neon-green ring-1 ring-neon-green/50 scale-[1.02]' : 'hover:border-neon-green/30'}\`}>
                <CardBody className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ background: \`\${c.color}15\` }}>
                      {c.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ color: c.color }}>{c.name}</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6 h-10 overflow-hidden line-clamp-2">
                    {c.description}
                  </p>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full border-neon-green text-neon-green bg-neon-green/10" disabled>
                      ✓ Your Current Club
                    </Button>
                  ) : (
                    <Button 
                      variant="solid" 
                      className="w-full" 
                      onClick={() => joinClub(c.id)}
                      disabled={joining}
                    >
                      {currentClub ? "Switch to this Club" : "Join Club"}
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
