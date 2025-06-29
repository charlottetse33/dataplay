import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Database, TestTube } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';

interface DatabaseConnectionFormProps {
  onConnectionSuccess: (connection: any) => void;
}

export const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({ onConnectionSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    database_type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    connection_string: '',
    ssl_mode: 'prefer',
    additional_options: {}
  });

  const [useConnectionString, setUseConnectionString] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { testConnection, saveConnection, isConnecting } = useDatabase();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
    setErrorMessage('');
  };

  const handleDatabaseTypeChange = (type: string) => {
    const defaultPorts: { [key: string]: number } = {
      postgresql: 5432,
      mysql: 3306,
      sqlite: 0,
      mongodb: 27017,
      mssql: 1433
    };

    setFormData(prev => ({
      ...prev,
      database_type: type,
      port: defaultPorts[type] || 5432,
      ssl_mode: type === 'sqlite' ? 'disable' : 'prefer'
    }));
    setUseConnectionString(type === 'mongodb');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMessage('');
    try {
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

  const isFormValid = formData.name && 
    (useConnectionString ? formData.connection_string : 
     (formData.database && (formData.database_type === 'sqlite' || (formData.host && formData.username))));

  const requiresCredentials = !['sqlite'].includes(formData.database_type);
  const requiresHost = !['sqlite', 'mongodb'].includes(formData.database_type) || !useConnectionString;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Connect to your database and let AI agents analyze your schema and perform transformations.
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
            <Label htmlFor="database_type">Database Type</Label>
            <Select value={formData.database_type} onValueChange={handleDatabaseTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
                <SelectItem value="mssql">SQL Server</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.database_type === 'mongodb' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useConnectionString"
                checked={useConnectionString}
                onChange={(e) => setUseConnectionString(e.target.checked)}
              />
              <Label htmlFor="useConnectionString">Use connection string</Label>
            </div>
          </div>
        )}

        {useConnectionString ? (
          <div className="space-y-2">
            <Label htmlFor="connection_string">Connection String</Label>
            <Textarea
              id="connection_string"
              placeholder="mongodb://username:password@host:port/database"
              value={formData.connection_string}
              onChange={(e) => handleInputChange('connection_string', e.target.value)}
              rows={3}
            />
          </div>
        ) : (
          <>
            {requiresHost && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={formData.host}
                    onChange={(e) => handleInputChange('host', e.target.value)}
                  />
                </div>
                {formData.database_type !== 'sqlite' && (
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="database">
                {formData.database_type === 'sqlite' ? 'Database File Path' : 'Database Name'}
              </Label>
              <Input
                id="database"
                placeholder={formData.database_type === 'sqlite' ? '/path/to/database.db' : 'myapp_production'}
                value={formData.database}
                onChange={(e) => handleInputChange('database', e.target.value)}
              />
            </div>

            {requiresCredentials && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="username"
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
            )}

            {!['sqlite', 'mongodb'].includes(formData.database_type) && (
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
            )}
          </>
        )}

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