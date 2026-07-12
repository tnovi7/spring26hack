import json
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, JsonResponse, Http404
from django.shortcuts import render

TEMPLATE_CONTEXT = {
    'supabase_url': settings.SUPABASE_URL,
    'supabase_key': settings.SUPABASE_KEY,
}

def login_view(request):
    return render(request, 'main/login.html', {**TEMPLATE_CONTEXT, 'page_title': 'Login'})

def dashboard(request):
    return render(request, 'main/dashboard.html', {**TEMPLATE_CONTEXT, 'page_title': 'Captain Dashboard'})

def complaints(request):
    return render(request, 'main/complaints.html', {**TEMPLATE_CONTEXT, 'page_title': 'Complaint Portal'})

def seatplan(request):
    return render(request, 'main/seatplan.html', {**TEMPLATE_CONTEXT, 'page_title': 'Seat Plan'})

def ai_tool(request):
    return render(request, 'main/ai.html', {**TEMPLATE_CONTEXT, 'page_title': 'AI Wrapper'})

def ledger(request):
    return render(request, 'main/ledger.html', {**TEMPLATE_CONTEXT, 'page_title': 'Corruption Ledger'})

def sos(request):
    return render(request, 'main/sos.html', {**TEMPLATE_CONTEXT, 'page_title': 'SOS Alert'})

def rules(request):
    return render(request, 'main/rules.html', {**TEMPLATE_CONTEXT, 'page_title': 'Rule Search'})

def captain_dashboard(request, level):
    return render(request, 'main/captain_dashboard.html', {
        **TEMPLATE_CONTEXT,
        'page_title': f'Captain Dashboard {level}',
        'captain_level': level,
    })

def service_worker(request):
    sw_path = Path(settings.BASE_DIR) / 'main' / 'static' / 'service-worker.js'
    if not sw_path.exists():
        raise Http404('Service worker not found')
    return HttpResponse(sw_path.read_text(), content_type='application/javascript')

def supabase_status(request):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return JsonResponse({'connected': False, 'message': 'Supabase configuration is not set in environment.'})
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        client.auth.get_session()
        return JsonResponse({'connected': True, 'message': 'Supabase client ready.'})
    except Exception:
        return JsonResponse({'connected': False, 'message': 'Supabase client is available, but connection could not be verified.'})
