@echo off

python -m llama_cpp.server ^
  --model Ai-Agent\models\Phi-3-mini-4k-instruct-q4.gguf ^
  --host 0.0.0.0 ^
  --port 8080 ^
  --n_ctx 4096 ^
  --n_threads 8 ^
  --n_batch 256 ^
  --chat_format chatml

pause
