var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Serve files from wwwroot (index.html, script.js, style.css)
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok("OK"));

app.Run();
