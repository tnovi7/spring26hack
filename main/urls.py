from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('dashboard/', views.dashboard, name='dashboard-alt'),
    path('complaints/', views.complaints, name='complaints'),
    path('seatplan/', views.seatplan, name='seatplan'),
    path('ai/', views.ai_tool, name='ai_tool'),
    path('ledger/', views.ledger, name='ledger'),
    path('sos/', views.sos, name='sos'),
    path('rules/', views.rules, name='rules'),
    path('captain/<int:level>/', views.captain_dashboard, name='captain_dashboard'),
    path('service-worker.js', views.service_worker, name='service-worker'),
    path('supabase/status/', views.supabase_status, name='supabase-status'),
]
