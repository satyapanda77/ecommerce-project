from django.contrib.auth.signals import user_logged_in
from django.core.mail import send_mail

def send_welcome_email(sender, user, request, **kwargs):
    subject = "Welcome to Our Store!"
    message = f"Hello {user.username},\n\nThank you for logging in. We’re excited to have you back!"
    send_mail(subject, message, "pandasatya232@gmail.com", [user.email])

user_logged_in.connect(send_welcome_email)
