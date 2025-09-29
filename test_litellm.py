from litellm import completion

resp = completion(
    model="openai/gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello from litellm"}]
)

print(resp)

