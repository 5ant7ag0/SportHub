import traceback
import os
from django.utils.deprecation import MiddlewareMixin

class ExceptionLoggerMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        log_file = os.path.join(os.getcwd(), 'fatal_error.log')
        with open(log_file, 'a') as f:
            f.write(f"\n--- FATAL ERROR AT {request.path} ---\n")
            f.write(traceback.format_exc())
            f.write("-" * 40 + "\n")
        return None  # Permite que Django siga procesando el error normalmente
