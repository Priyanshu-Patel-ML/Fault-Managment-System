import subprocess
import os

def find_airflow_dags_folder():
    """Find where Airflow expects DAG files"""
    
    try:
        # Get DAGs folder from Airflow config
        result = subprocess.run(['airflow', 'config', 'get-value', 'core', 'dags_folder'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            dags_folder = result.stdout.strip()
            print(f"✅ Airflow DAGs folder: {dags_folder}")
            
            # Check if folder exists
            if os.path.exists(dags_folder):
                print(f"✅ Folder exists")
                
                # List current contents
                files = os.listdir(dags_folder)
                print(f"📁 Current files in DAGs folder ({len(files)} files):")
                for file in files[:10]:  # Show first 10 files
                    print(f"  📄 {file}")
                if len(files) > 10:
                    print(f"  ... and {len(files) - 10} more files")
                    
            else:
                print(f"❌ DAGs folder does not exist: {dags_folder}")
                
            return dags_folder
        else:
            print(f"❌ Failed to get DAGs folder: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    find_airflow_dags_folder()
