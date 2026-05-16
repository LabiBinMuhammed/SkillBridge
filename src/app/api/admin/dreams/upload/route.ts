import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabaseAdmin = await createServiceClient();

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as { row: string; error: string }[]
    };

    // Use a map to keep track of inserted/fetched IDs to optimize and correctly link hierarchy
    const dreamMap = new Map<string, string>();
    const skillMap = new Map<string, string>();

    let lastDreamName = "";
    let lastSkillName = "";

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      let { 
        dream_name, dream_description, dream_icon, dream_color,
        skill_name, skill_description, skill_xp, skill_coin,
        task_title, task_description, task_minutes,
        xp_reward, coin_reward, difficulty
      } = item;

      // Inherit logic for easier CSV creation
      if (dream_name && dream_name.trim() !== lastDreamName) {
        lastDreamName = dream_name.trim();
        lastSkillName = ""; // Reset skill context on new dream
      } else if (!dream_name && lastDreamName) {
        dream_name = lastDreamName;
      }

      if (skill_name && skill_name.trim() !== lastSkillName) {
        lastSkillName = skill_name.trim();
      } else if (!skill_name && lastSkillName) {
        skill_name = lastSkillName;
      }

      if (!dream_name) {
        results.failed++;
        results.errors.push({ row: `Row ${index + 1}`, error: "dream_name is required" });
        continue;
      }

      let dreamId = dreamMap.get(dream_name.toLowerCase().trim());

      try {
        // Upsert Dream
        if (!dreamId) {
          const { data: existingDream } = await supabaseAdmin
            .from("dreams")
            .select("id")
            .ilike("name", dream_name.trim())
            .single();

          if (existingDream) {
            dreamId = existingDream.id;
            
            // Only update fields that are explicitly provided
            const updates: any = {};
            if (dream_description) updates.description = dream_description;
            if (dream_icon) updates.icon = dream_icon;
            if (dream_color) updates.color = dream_color;
            
            if (Object.keys(updates).length > 0) {
              await supabaseAdmin.from("dreams").update(updates).eq("id", dreamId);
            }
          } else {
            const { data: newDream, error: dreamError } = await supabaseAdmin
              .from("dreams")
              .insert({
                name: dream_name.trim(),
                description: dream_description || "",
                icon: dream_icon || "🎯",
                color: dream_color || "#00FF41"
              })
              .select()
              .single();

            if (dreamError) throw new Error(`Dream error: ${dreamError.message}`);
            dreamId = newDream.id;
          }
          if (dreamId) {
            dreamMap.set(dream_name.toLowerCase().trim(), dreamId);
          }
        }

        // Upsert Skill
        let skillId = null;
        if (skill_name) {
          const skillKey = `${dreamId}-${skill_name.toLowerCase().trim()}`;
          skillId = skillMap.get(skillKey);

          if (!skillId) {
            const { data: existingSkill } = await supabaseAdmin
              .from("skills")
              .select("id")
              .eq("dream_id", dreamId)
              .ilike("name", skill_name.trim())
              .single();

            if (existingSkill) {
              skillId = existingSkill.id;
              
              const updates: any = {};
              if (skill_description) updates.description = skill_description;
              if (skill_xp) updates.xp_reward = parseInt(skill_xp);
              if (skill_coin) updates.coin_reward = parseInt(skill_coin);
              
              if (Object.keys(updates).length > 0) {
                await supabaseAdmin.from("skills").update(updates).eq("id", skillId);
              }
            } else {
              const { data: newSkill, error: skillError } = await supabaseAdmin
                .from("skills")
                .insert({
                  dream_id: dreamId,
                  name: skill_name.trim(),
                  description: skill_description || "",
                  xp_reward: parseInt(skill_xp) || 50,
                  coin_reward: parseInt(skill_coin) || 10
                })
                .select()
                .single();

              if (skillError) throw new Error(`Skill error: ${skillError.message}`);
              skillId = newSkill.id;
            }
            if (skillId) {
              skillMap.set(skillKey, skillId);
            }
          }
        }

        // Upsert Task
        if (skillId && task_title) {
          const { data: existingTask } = await supabaseAdmin
            .from("tasks")
            .select("id")
            .eq("skill_id", skillId)
            .ilike("title", task_title.trim())
            .single();

          let difficultyNum = 1;
          if (difficulty === "Intermediate") difficultyNum = 2;
          else if (difficulty === "Advanced") difficultyNum = 3;

          if (existingTask) {
            const updates: any = {};
            if (task_description) updates.description = task_description;
            if (task_minutes) updates.estimated_minutes = parseInt(task_minutes);
            if (xp_reward) updates.xp_reward = parseInt(xp_reward);
            if (coin_reward) updates.coin_reward = parseInt(coin_reward);
            if (difficulty) updates.difficulty = difficultyNum;
            
            if (Object.keys(updates).length > 0) {
              await supabaseAdmin.from("tasks").update(updates).eq("id", existingTask.id);
            }
          } else {
            const { error: taskError } = await supabaseAdmin
              .from("tasks")
              .insert({
                skill_id: skillId,
                title: task_title.trim(),
                description: task_description || "",
                estimated_minutes: parseInt(task_minutes) || 30,
                xp_reward: parseInt(xp_reward) || 25,
                coin_reward: parseInt(coin_reward) || 5,
                difficulty: difficultyNum
              });

            if (taskError) throw new Error(`Task error: ${taskError.message}`);
          }
        }

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ row: `Row ${index + 1} (${dream_name})`, error: error.message });
      }
    }

    return NextResponse.json({
      message: "Upload completed",
      results
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
