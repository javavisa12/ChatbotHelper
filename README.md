file_details = []
for path in attached_files:
    p = Path(path)
    if p.exists():
        file_details.append({
            "filename": p.name,
            "path": str(p),
            "size": p.stat().st_size
        })
