import socket

def get_host_ip():
    """Returns the IP address of the host machine."""
    try:
        # Create a socket connection to an external server to get the IP
        # This won't send data but will let us discover the host IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            ip_address = s.getsockname()[0]
        return ip_address
    except Exception as e:
        return f"Error retrieving IP address: {e}"

# # Example usage
# if __name__ == "__main__":
#     print(f"Host IP Address: {get_host_ip()}")
