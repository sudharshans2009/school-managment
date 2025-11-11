"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { FolderOpen, RotateCcw, Save, ExternalLink } from "lucide-react";
import {
  getExportSettings,
  updateExportSettings,
  resetExportSettings,
  selectExportDirectory,
  openExportDirectory,
  isExportAvailable,
  type ExportSettings,
} from "@/lib/tauri/csv-export";

export function ExportSettingsCard() {
  const [settings, setSettings] = useState<ExportSettings>({
    export_directory: "./exports",
    auto_open: false,
    include_timestamp: true,
  });
  const [loading, setLoading] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  const loadSettings = async () => {
    try {
      const currentSettings = await getExportSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  useEffect(() => {
    setIsTauri(isExportAvailable());
    if (isExportAvailable()) {
      loadSettings();
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateExportSettings(settings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const defaultSettings = await resetExportSettings();
      setSettings(defaultSettings);
      alert("Settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      alert("Failed to reset settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const newDir = await selectExportDirectory();
      if (newDir) {
        setSettings({ ...settings, export_directory: newDir });
        alert(`Directory changed to: ${newDir}`);
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
      alert("Failed to select directory");
    }
  };

  const handleOpenDirectory = async () => {
    try {
      await openExportDirectory();
    } catch (error) {
      console.error("Failed to open directory:", error);
      alert("Failed to open export directory");
    }
  };

  if (!isTauri) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CSV Export Settings</CardTitle>
          <CardDescription>
            Export settings are only available in the desktop app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Download the desktop app to configure CSV export settings and save
            files locally.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Export Settings</CardTitle>
        <CardDescription>
          Configure where CSV files are saved and export behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Directory */}
        <div className="space-y-2">
          <Label htmlFor="export-directory">Export Directory</Label>
          <div className="flex gap-2">
            <Input
              id="export-directory"
              value={settings.export_directory}
              onChange={(e) =>
                setSettings({ ...settings, export_directory: e.target.value })
              }
              placeholder="Select export directory..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSelectDirectory}
              title="Browse..."
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenDirectory}
              title="Open directory"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Location where CSV files will be saved
          </p>
        </div>

        {/* Auto-open */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-open">Auto-open Files</Label>
            <p className="text-xs text-muted-foreground">
              Automatically open CSV files after export
            </p>
          </div>
          <Switch
            id="auto-open"
            checked={settings.auto_open}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, auto_open: checked })
            }
          />
        </div>

        {/* Include Timestamp */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="include-timestamp">Include Timestamp</Label>
            <p className="text-xs text-muted-foreground">
              Add timestamp to filename (e.g., students_20250108_143025.csv)
            </p>
          </div>
          <Switch
            id="include-timestamp"
            checked={settings.include_timestamp}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, include_timestamp: checked })
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
