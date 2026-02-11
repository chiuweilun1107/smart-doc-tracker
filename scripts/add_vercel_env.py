import os
import subprocess

def add_env_var(key, value):
    targets = ['production', 'preview', 'development']
    for target in targets:
        print(f"Adding {key} to {target}...")
        try:
            # Check if exists first to avoid interactive prompt or error
            # Actually just try to add, if it prompts we can try skipping or we can assume clean state
            # If we pipe 'y', it handles overwrite prompt if any
            result = subprocess.run(
                ['vercel', 'env', 'add', key, target],
                input=value.encode(),
                capture_output=True
            )
            if result.returncode == 0:
                print(f"Successfully added {key} to {target}")
            else:
                print(f"Failed to add {key} to {target}: {result.stderr.decode()}")
        except Exception as e:
            print(f"Error adding {key}: {e}")

def main():
    env_file = '.env'
    if not os.path.exists(env_file):
        print(f"{env_file} not found")
        return

    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                if (value.startswith('"') and value.endswith('"')) or \
                   (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]
                
                add_env_var(key, value)

if __name__ == "__main__":
    main()
