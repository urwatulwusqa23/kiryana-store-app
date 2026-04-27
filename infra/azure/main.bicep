// Deploy: App Service (Linux, container) + Azure SQL.
// Not free: App Service on Linux for containers needs at least a Basic (B) plan. Use Azure for Students / credits.
// After deploy, build and push the image from deploy/Dockerfile.cloud, then set the Web App container to that image.

@description('Base name for resources; must be globally unique for some names.')
param baseName string = 'kiryana'

@description('Azure region, e.g. eastus, westeurope')
param location string = resourceGroup().location

@description('SQL admin login (not "admin" or reserved words).')
param sqlAdminLogin string = 'kiryanaadmin'

@secure()
@description('Strong SQL admin password (Azure complexity rules).')
param sqlAdminPassword string

@description('Public container image the Web App will run, e.g. ghcr.io/owner/repo:tag')
param containerImage string = 'docker.io/library/nginx:alpine'

@description('Optional tag prefix for unique names')
var unique = uniqueString(resourceGroup().id, baseName, location)

var sqlServerName = 'sql-${baseName}-${unique}'
var appPlanName = 'plan-${baseName}-${unique}'
var webAppName = 'app-${baseName}-${unique}'
var dbName = 'KiryanaStoreDb'

resource sqlServer 'Microsoft.Sql/servers@2021-11-01' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Allow Azure services (including App Service) to reach SQL. Tighten for production.
resource allowAzureIps 'Microsoft.Sql/servers/firewallRules@2021-11-01' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource database 'Microsoft.Sql/servers/databases@2021-11-01' = {
  parent: sqlServer
  name: dbName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

var sqlFqdn = '${sqlServer.name}.database.windows.net'
var defaultConnection = 'Server=tcp:${sqlFqdn},1433;Initial Catalog=${dbName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;MultipleActiveResultSets=True;'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appPlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    httpsOnly: true
    serverFarmId: appServicePlan.id
    siteConfig: {
      alwaysOn: true
      linuxFxVersion: 'DOCKER|${containerImage}'
      appSettings: [
        { name: 'WEBSITES_PORT', value: '8080' }
        { name: 'ASPNETCORE_URLS', value: 'http://+:8080' }
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
      ]
    }
  }
}

// Connection string for ASP.NET Core: DefaultConnection
resource webAppConnectionStrings 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: webApp
  name: 'connectionstrings'
  properties: {
    DefaultConnection: {
      value: defaultConnection
      type: 'SQLAzure'
    }
  }
}

output webAppName string = webApp.name
output defaultHostName string = webApp.properties.defaultHostName
output sqlServerFqdn string = sqlFqdn
output imageHint string = 'Set Web App container to your ghcr.io image after docker push. Current placeholder: ${containerImage}'
