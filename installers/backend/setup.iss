; Archivist Backend Installer — Inno Setup Script
; Compile with: iscc setup.iss
; Requires: build_installer.ps1 to have run first to prepare the build/ directory.

#define AppName "Archivist Backend"
#define AppVersion "1.0.0"
#define AppPublisher "Archivist"
#define AppURL "https://github.com/Hazmat1602/Archivist"

[Setup]
AppId={{A7C3E1D0-4B2F-4A8E-9D6C-1F3E5A7B9C0D}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppSupportURL={#AppURL}
DefaultDirName={autopf}\Archivist\Backend
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputBaseFilename=ArchivistBackendSetup
OutputDir=output
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallMode=x64compatible
UninstallDisplayName={#AppName}
CloseApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Backend application source
Source: "build\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\pyproject.toml"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\poetry.lock"; DestDir: "{app}"; Flags: ignoreversion

; Embedded Python distribution
Source: "build\python\*"; DestDir: "{app}\python"; Flags: ignoreversion recursesubdirs createallsubdirs

; WinSW service wrapper (pre-renamed to ArchivistBackend.exe)
Source: "build\winsw\ArchivistBackend.exe"; DestDir: "{app}\service"; Flags: ignoreversion

; Template .env.example for reference
Source: "build\.env.example"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Dirs]
Name: "{app}\logs"

[UninstallRun]
Filename: "{app}\service\ArchivistBackend.exe"; Parameters: "stop"; Flags: runhidden; RunOnceId: "StopService"
Filename: "{app}\service\ArchivistBackend.exe"; Parameters: "uninstall"; Flags: runhidden; RunOnceId: "RemoveService"

[Code]
var
  DBPage: TInputQueryWizardPage;
  ServicePage: TInputQueryWizardPage;
  AdvancedDBPage: TInputQueryWizardPage;

procedure InitializeWizard;
begin
  { Database connection page }
  DBPage := CreateInputQueryPage(wpSelectDir,
    'Database Configuration',
    'Configure the SQL Server connection.',
    'Enter the SQL Server connection details. The installer will use these to connect to your database.');
  DBPage.Add('SQL Server hostname:', False);
  DBPage.Add('Database name:', False);
  DBPage.Add('Username:', False);
  DBPage.Add('Password:', True);

  DBPage.Values[0] := 'localhost';
  DBPage.Values[1] := 'Archivist';
  DBPage.Values[2] := 'sa';
  DBPage.Values[3] := '';

  { Advanced DB settings }
  AdvancedDBPage := CreateInputQueryPage(DBPage.ID,
    'Advanced Database Settings',
    'ODBC driver and encryption settings.',
    'These defaults work for most installations. Change only if needed.');
  AdvancedDBPage.Add('ODBC Driver:', False);
  AdvancedDBPage.Add('Connection Encryption:', False);
  AdvancedDBPage.Add('Trust Server Certificate:', False);

  AdvancedDBPage.Values[0] := 'ODBC Driver 18 for SQL Server';
  AdvancedDBPage.Values[1] := 'Optional';
  AdvancedDBPage.Values[2] := 'Yes';

  { Service configuration page }
  ServicePage := CreateInputQueryPage(AdvancedDBPage.ID,
    'Service Configuration',
    'Configure the Archivist API service.',
    'Set the port and session timeout for the backend API.');
  ServicePage.Add('API Port:', False);
  ServicePage.Add('Session timeout (minutes):', False);

  ServicePage.Values[0] := '8000';
  ServicePage.Values[1] := '480';
end;

function GenerateRandomString(Len: Integer): String;
var
  I: Integer;
  C: Integer;
  Chars: String;
begin
  Chars := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  Result := '';
  for I := 1 to Len do
  begin
    C := Random(Length(Chars)) + 1;
    Result := Result + Chars[C];
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  { Validate DB page }
  if CurPageID = DBPage.ID then
  begin
    if Trim(DBPage.Values[0]) = '' then
    begin
      MsgBox('Please enter the SQL Server hostname.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    if Trim(DBPage.Values[1]) = '' then
    begin
      MsgBox('Please enter the database name.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    if Trim(DBPage.Values[2]) = '' then
    begin
      MsgBox('Please enter the SQL Server username.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
  end;

  { Validate Service page }
  if CurPageID = ServicePage.ID then
  begin
    if Trim(ServicePage.Values[0]) = '' then
    begin
      MsgBox('Please enter the API port.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvContent: String;
  XmlContent: String;
  JwtSecret: String;
  Port: String;
  PythonExe: String;
  ServiceExe: String;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    { Generate random JWT secret }
    JwtSecret := GenerateRandomString(48);
    Port := ServicePage.Values[0];
    PythonExe := ExpandConstant('{app}\python\python.exe');
    ServiceExe := ExpandConstant('{app}\service\ArchivistBackend.exe');

    { Write .env configuration file }
    EnvContent :=
      '# Archivist Backend Configuration' + #13#10 +
      '# Generated by installer on ' + GetDateTimeString('yyyy-mm-dd hh:nn:ss', '-', ':') + #13#10 + #13#10 +
      '# SQL Server connection' + #13#10 +
      'DB_SERVER=' + DBPage.Values[0] + #13#10 +
      'DB_NAME=' + DBPage.Values[1] + #13#10 +
      'DB_USERNAME=' + DBPage.Values[2] + #13#10 +
      'DB_PASSWORD=' + DBPage.Values[3] + #13#10 +
      'DB_DRIVER=' + AdvancedDBPage.Values[0] + #13#10 +
      'DB_ENCRYPT=' + AdvancedDBPage.Values[1] + #13#10 +
      'DB_TRUST_CERT=' + AdvancedDBPage.Values[2] + #13#10 + #13#10 +
      '# JWT Authentication' + #13#10 +
      'JWT_SECRET_KEY=' + JwtSecret + #13#10 +
      'ACCESS_TOKEN_EXPIRE_MINUTES=' + ServicePage.Values[1] + #13#10;

    SaveStringToFile(ExpandConstant('{app}\.env'), EnvContent, False);

    { Write WinSW XML configuration file }
    XmlContent :=
      '<service>' + #13#10 +
      '  <id>ArchivistBackend</id>' + #13#10 +
      '  <name>Archivist Backend API</name>' + #13#10 +
      '  <description>Archivist records management backend API</description>' + #13#10 +
      '  <executable>' + PythonExe + '</executable>' + #13#10 +
      '  <arguments>-m uvicorn app.main:app --host 0.0.0.0 --port ' + Port + '</arguments>' + #13#10 +
      '  <workingdirectory>' + ExpandConstant('{app}') + '</workingdirectory>' + #13#10 +
      '  <logpath>' + ExpandConstant('{app}\logs') + '</logpath>' + #13#10 +
      '  <log mode="roll-by-size">' + #13#10 +
      '    <sizeThreshold>1048576</sizeThreshold>' + #13#10 +
      '    <keepFiles>5</keepFiles>' + #13#10 +
      '  </log>' + #13#10 +
      '  <startmode>Automatic</startmode>' + #13#10 +
      '</service>' + #13#10;

    SaveStringToFile(ExpandConstant('{app}\service\ArchivistBackend.xml'), XmlContent, False);

    { Install Python dependencies using pip }
    WizardForm.StatusLabel.Caption := 'Installing Python dependencies...';
    Exec(PythonExe,
      '-m pip install --no-warn-script-location fastapi[standard] sqlalchemy pyodbc python-dateutil python-multipart "passlib[bcrypt]" "python-jose[cryptography]" python-dotenv argon2-cffi pandas openpyxl python-docx docxtpl uvicorn',
      ExpandConstant('{app}'), SW_HIDE, ewWaitUntilTerminated, ResultCode);

    { Stop and remove existing service if present }
    Exec(ServiceExe, 'stop', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(ServiceExe, 'uninstall', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    { Install and start the Windows service }
    WizardForm.StatusLabel.Caption := 'Registering Windows service...';
    Exec(ServiceExe, 'install', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    WizardForm.StatusLabel.Caption := 'Starting service...';
    Exec(ServiceExe, 'start', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    { Add firewall rule }
    Exec('netsh',
      'advfirewall firewall add rule name="Archivist API" dir=in action=allow protocol=tcp localport=' + Port,
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    { Remove firewall rule }
    Exec('netsh',
      'advfirewall firewall delete rule name="Archivist API"',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
