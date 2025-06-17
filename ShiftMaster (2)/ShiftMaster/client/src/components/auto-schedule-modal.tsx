import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import type { Employee } from "@shared/schema";

import type { AutoScheduleSettings } from "./auto-schedule-settings-modal";

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: AutoScheduleSettings;
}

const autoScheduleSchema = z.object({
  selectedEmployees: z.array(z.number()).min(1, "Select at least one employee"),
  phoneHours: z.number().min(1).max(8),
  chatHours: z.number().min(0).max(8),
  emailHours: z.number().min(0).max(8),
  weekId: z.string().default("current"),
});

type AutoScheduleForm = z.infer<typeof autoScheduleSchema>;

export default function AutoScheduleModal({ isOpen, onClose, settings }: AutoScheduleModalProps) {
  const { toast } = useToast();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<AutoScheduleForm>({
    resolver: zodResolver(autoScheduleSchema),
    defaultValues: {
      selectedEmployees: [],
      phoneHours: 4,
      chatHours: 1,
      emailHours: 3,
      weekId: "current",
    },
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async (data: AutoScheduleForm) => {
      const response = await apiRequest("POST", "/api/generate-schedule", {
        employees: data.selectedEmployees,
        weekId: data.weekId,
        phoneHours: data.phoneHours,
        chatHours: data.chatHours,
        emailHours: data.emailHours,
        shiftDistribution: ["shift_8_16", "shift_10_18", "shift_12_20"],
        minAgentsWeekdays: settings?.minAgentsWeekdays || 2,
        minWorkersWeekend: settings?.minWorkersWeekend || 1,
        // Weekday shift minimums
        minAgents08_16Weekdays: settings?.minAgents08_16Weekdays || 1,
        minAgents10_18Weekdays: settings?.minAgents10_18Weekdays || 1,
        minAgents12_20Weekdays: settings?.minAgents12_20Weekdays || 1,
        // Weekend shift minimums
        minAgents08_16Weekend: settings?.minAgents08_16Weekend || 0,
        minAgents10_18Weekend: settings?.minAgents10_18Weekend || 1,
        minAgents12_20Weekend: settings?.minAgents12_20Weekend || 0
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/task-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Schedule Generated",
        description: "Automatic schedule has been created successfully",
      });
      form.reset();
      setSelectedEmployeeIds([]);
      onClose();
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate automatic schedule",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AutoScheduleForm) => {
    const totalHours = data.phoneHours + data.chatHours + data.emailHours;
    if (totalHours !== 8) {
      toast({
        title: "Invalid Task Distribution",
        description: "Total task hours must equal 8 hours per shift",
        variant: "destructive",
      });
      return;
    }

    generateScheduleMutation.mutate({
      ...data,
      selectedEmployees: selectedEmployeeIds,
    });
  };

  const handleEmployeeToggle = (employeeId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
    }
    form.setValue("selectedEmployees", selectedEmployeeIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            <span>Auto-Generate Schedule</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Employees</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={(checked) => 
                        handleEmployeeToggle(employee.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="text-sm text-gray-700 cursor-pointer flex items-center space-x-2"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: employee.color }}
                      >
                        {employee.initials}
                      </div>
                      <span>{employee.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Hours Distribution */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Task Distribution (8 hours total)</Label>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phoneHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Phone Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={8}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chatHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Chat Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={8}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email/Other Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={8}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Shift Types:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Morning: 08:00 - 16:00</li>
                  <li>• Midday: 10:00 - 18:00</li>
                  <li>• Evening: 12:00 - 20:00</li>
                </ul>
              </div>

              {/* Current Settings Display */}
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                <strong>Current Schedule Settings:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Minimum agents (weekdays): {settings?.minAgentsWeekdays || 2}</li>
                  <li>• Minimum workers (weekend): {settings?.minWorkersWeekend || 1}</li>
                </ul>
                <div className="text-xs text-blue-600 mt-1">
                  Use the settings button to modify these parameters
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={generateScheduleMutation.isPending || selectedEmployeeIds.length === 0}
              >
                {generateScheduleMutation.isPending ? "Generating..." : "Generate Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}