FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/KiryanaStore.API/KiryanaStore.API.csproj", "src/KiryanaStore.API/"]
COPY ["src/KiryanaStore.Application/KiryanaStore.Application.csproj", "src/KiryanaStore.Application/"]
COPY ["src/KiryanaStore.Domain/KiryanaStore.Domain.csproj", "src/KiryanaStore.Domain/"]
COPY ["src/KiryanaStore.Infrastructure/KiryanaStore.Infrastructure.csproj", "src/KiryanaStore.Infrastructure/"]
RUN dotnet restore "src/KiryanaStore.API/KiryanaStore.API.csproj"
COPY . .
WORKDIR "/src/src/KiryanaStore.API"
RUN dotnet build "KiryanaStore.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "KiryanaStore.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY entrypoint.sh /entrypoint.sh
# Normalize Windows line endings if the repo was checked out on Windows
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh
EXPOSE 8080 10000
ENTRYPOINT ["/entrypoint.sh"]
