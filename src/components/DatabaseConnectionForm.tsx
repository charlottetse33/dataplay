import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Database, TestTube } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';

interface DatabaseConnectionFormProps {
  onConnectionSuccess: (connection: any) => void;
}

export const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({ onConnectionSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl_mode: 'prefer'
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { testConnection, saveConnection, isConnecting } = useDatabase();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
    setErrorMessage('');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMessage('');
    try {
      console.log('Testing connection with form data:', { ...formData, password: '[HIDDEN]' });
      const success = await testConnection(formData);
      setTestResult(success ? 'success' : 'error');
      if (!success) {
        setErrorMessage('Connection test failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResult('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    try {
      const connection = await saveConnection(formData);
      onConnectionSuccess(connection);
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  };

  const isFormValid = formData.name && formData.host && formData.database && formData.username;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          PostgreSQL Connection
        </CardTitle>
        <CardDescription>
          Enter your PostgreSQL database credentials to connect and analyze your schema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My Database"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              placeholder="localhost"
              value={formData.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="5432"
              value={formData.port}
              onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5432)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              placeholder="myapp_production"
              value={formData.database}
              onChange={(e) => handleInputChange('database', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="postgres"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssl_mode">SSL Mode</Label>
          <Select value={formData.ssl_mode} onValueChange={(value) => handleInputChange('ssl_mode', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disable">Disable</SelectItem>
              <SelectItem value="allow">Allow</SelectItem>
              <SelectItem value="prefer">Prefer</SelectItem>
              <SelectItem value="require">Require</SelectItem>
              <SelectItem value="verify-ca">Verify CA</SelectItem>
              <SelectItem value="verify-full">Verify Full</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {testResult && (
          <div className={`p-3 rounded-md ${testResult === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult === 'success' ? 'Connection test successful!' : errorMessage || 'Connection test failed. Please check your credentials.'}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!isFormValid || isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test Connection
          </Button>
          
          <Button
            onClick={handleSaveConnection}
            disabled={!isFormValid || testResult !== 'success' || isConnecting}
            className="flex items-center gap-2"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Connect & Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};