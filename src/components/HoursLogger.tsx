import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

interface HoursLoggerProps {
  eventId: string;
  eventTitle: string;
  onHoursLogged?: () => void;
}

export const HoursLogger = ({ eventId, eventTitle, onHoursLogged }: HoursLoggerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hours: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const hours = parseFloat(formData.hours);
      if (isNaN(hours) || hours <= 0) {
        throw new Error("Please enter valid hours");
      }

      // Insert volunteer hours
      const { error: insertError } = await supabase
        .from("volunteer_hours")
        .insert({
          volunteer_id: user.id,
          event_id: eventId,
          hours: hours,
          date: formData.date,
          notes: formData.notes || null,
        });

      if (insertError) throw insertError;

      // Update profile hours
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("hours_volunteered")
        .eq("id", user.id)
        .single();

      const newTotal = (currentProfile?.hours_volunteered || 0) + hours;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ hours_volunteered: newTotal })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: `Logged ${hours} hours for ${eventTitle}`,
      });

      setFormData({ hours: "", date: new Date().toISOString().split("T")[0], notes: "" });
      setOpen(false);
      onHoursLogged?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Log Hours
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Volunteer Hours</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="hours">Hours Volunteered</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="e.g., 2.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What did you do during this volunteer session?"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Logging..." : "Log Hours"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
