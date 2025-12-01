#!/bin/bash

echo "🧹 Starting Chaos Mesh complete cleanup..."

# Remove all Chaos Mesh CRDs first
echo "Removing Chaos Mesh CRDs..."
kubectl get crd | grep chaos-mesh | awk '{print $1}' | xargs -r kubectl delete crd --ignore-not-found

# Force remove any remaining resources in the namespace
echo "Force removing remaining resources..."
kubectl get all -n chaos-mesh 2>/dev/null | grep -v "No resources found" && \
kubectl delete all --all -n chaos-mesh --force --grace-period=0

# Patch namespace to remove finalizers
echo "Removing namespace finalizers..."
kubectl patch namespace chaos-mesh -p '{"metadata":{"finalizers":[]}}' --type=merge 2>/dev/null
kubectl patch namespace chaos-mesh -p '{"spec":{"finalizers":[]}}' --type=merge 2>/dev/null

# Force delete namespace
echo "Force deleting namespace..."
kubectl delete namespace chaos-mesh --force --grace-period=0 2>/dev/null

# Wait and check
sleep 5
if kubectl get ns chaos-mesh 2>/dev/null; then
    echo "❌ Namespace still exists, trying nuclear option..."
    kubectl get namespace chaos-mesh -o json | jq '.spec.finalizers = []' | kubectl replace --raw "/api/v1/namespaces/chaos-mesh/finalize" -f -
else
    echo "✅ Chaos Mesh namespace successfully removed!"
fi

# Verify cleanup
echo "Final verification..."
kubectl get ns | grep chaos-mesh || echo "✅ No chaos-mesh namespace found"
kubectl get crd | grep chaos-mesh || echo "✅ No chaos-mesh CRDs found"

echo "🎉 Cleanup complete! Ready for fresh installation."
